import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useTransport } from '@/contexts/TransportContext'
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const EDITABLE_STATUS = STATUS_OPTIONS.filter((s) => s.value !== 'all')

const emptyForm = {
  code: '',
  name: '',
  description: '',
  organizer_name: '',
  country_code: '',
  city: '',
  expected_guests: 100,
  max_fleet: 10,
  max_vapp: 50,
  start_at: '',
  end_at: '',
  timezone: 'UTC',
  status: 'planning',
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

const formatDateTimeForApi = (value) => {
  if (!value) return null
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  if (isDateOnly) return `${value}T00:00:00Z`
  if (value.includes('T') && value.includes('Z')) return value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export default function Events() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { client } = useTransport()

  const aggregate = useMemo(() => {
    if (!client) return null
    return getEventAggregate(null, client)
  }, [client])

  const [listState, setListState] = useState({
    list: { events: [], pagination: null },
    listLoading: false,
    listError: '',
  })
  const [formError, setFormError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ ...emptyForm })
  const limit = 10

  const fetchEvents = useCallback(async () => {
    if (!aggregate?.events) return
    await aggregate.events.list({
      page,
      limit,
      search: query,
      status,
    })
  }, [aggregate, page, limit, query, status])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (!aggregate?.events) return
    return aggregate.events.subscribe((state) => {
      setListState({
        list: state.list,
        listLoading: state.listLoading,
        listError: state.listError,
      })
    })
  }, [aggregate])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleSearchChange = (value) => {
    setQuery(value)
    setPage(1)
  }

  const handleStatusChange = (value) => {
    setStatus(value)
    setPage(1)
  }

  const statusLabel = useMemo(() => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.label || 'All'
  }, [status])

  const openCreate = () => {
    setEditingId(null)
    setFormData({ ...emptyForm })
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (event) => {
    setEditingId(event.id)
    setFormData({
      code: event.code || '',
      name: event.name || '',
      description: event.description || '',
      organizer_name: event.organizer_name || '',
      country_code: event.country_code || '',
      city: event.city || '',
      expected_guests: event.expected_guests || 0,
      max_fleet: event.max_fleet || 0,
      max_vapp: event.max_vapp || 0,
      start_at: event.start_at ? event.start_at.slice(0, 16) : '',
      end_at: event.end_at ? event.end_at.slice(0, 16) : '',
      timezone: event.timezone || 'UTC',
      status: event.status || 'planning',
    })
    setFormError('')
    setFormOpen(true)
  }

  const updateForm = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const submitForm = async () => {
    if (!client) return
    if (!formData.name.trim()) {
      setFormError('Event name is required')
      return
    }
    if (!formData.start_at) {
      setFormError('Start date is required')
      return
    }
    if (!formData.end_at) {
      setFormError('End date is required')
      return
    }
    if (new Date(formData.end_at) <= new Date(formData.start_at)) {
      setFormError('End date must be after start date')
      return
    }
    setIsSaving(true)
    setFormError('')
    try {
      const payload = {
        code: formData.code || null,
        name: formData.name,
        description: formData.description || null,
        organizer_name: formData.organizer_name || null,
        country_code: formData.country_code
          ? formData.country_code.toUpperCase()
          : null,
        city: formData.city || null,
        expected_guests: Number(formData.expected_guests || 0),
        max_fleet: Number(formData.max_fleet || 0),
        max_vapp: Number(formData.max_vapp || 0),
        start_at: formatDateTimeForApi(formData.start_at),
        end_at: formatDateTimeForApi(formData.end_at),
        timezone: formData.timezone || 'UTC',
        status: formData.status || 'planning',
      }

      if (!aggregate?.events) {
        throw new Error('Event aggregate not ready')
      }

      if (editingId) {
        await aggregate.events.update({ id: String(editingId), data: payload })
      } else {
        const created = await aggregate.events.create(payload)
        if (created?.id) {
          setFormOpen(false)
          navigate(`/events/${created.id}`, { state: { event: created } })
          return
        }
      }

      setFormOpen(false)
      await fetchEvents()
    } catch (err) {
      setFormError(err?.message || 'Failed to save event')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground">Browse and manage event workspaces</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreate} variant="default">
              Create Event
            </Button>
            <Button onClick={fetchEvents} variant="outline" disabled={listState.listLoading}>
              {listState.listLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {formOpen && (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Event' : 'Create Event'}</CardTitle>
              <CardDescription>Fill in the event details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Event code"
                  value={formData.code}
                  onChange={(e) => updateForm('code', e.target.value)}
                />
                <Input
                  placeholder="Event name"
                  value={formData.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                />
                <Input
                  placeholder="Organizer name"
                  value={formData.organizer_name}
                  onChange={(e) => updateForm('organizer_name', e.target.value)}
                />
                <Input
                  placeholder="Timezone (e.g., UTC)"
                  value={formData.timezone}
                  onChange={(e) => updateForm('timezone', e.target.value)}
                />
                <Input
                  placeholder="Country code (AE)"
                  value={formData.country_code}
                  onChange={(e) => updateForm('country_code', e.target.value)}
                  maxLength={2}
                />
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => updateForm('city', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Expected guests"
                  value={formData.expected_guests}
                  onChange={(e) => updateForm('expected_guests', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max fleet"
                  value={formData.max_fleet}
                  onChange={(e) => updateForm('max_fleet', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max vapp"
                  value={formData.max_vapp}
                  onChange={(e) => updateForm('max_vapp', e.target.value)}
                />
                <Input
                  type="datetime-local"
                  placeholder="Start"
                  value={formData.start_at}
                  onChange={(e) => updateForm('start_at', e.target.value)}
                />
                <Input
                  type="datetime-local"
                  placeholder="End"
                  value={formData.end_at}
                  onChange={(e) => updateForm('end_at', e.target.value)}
                />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.status}
                  onChange={(e) => updateForm('status', e.target.value)}
                >
                  {EDITABLE_STATUS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <textarea
                  className="min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2"
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                />
              </div>
              {formError && <div className="mt-3 text-sm text-red-600">{formError}</div>}
              <div className="mt-4 flex gap-2">
                <Button onClick={submitForm} disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingId ? 'Update Event' : 'Create Event'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search by name, description, or organizer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Search events..."
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="text-sm text-muted-foreground flex items-center">
                Status: <span className="ml-2 font-medium text-foreground">{statusLabel}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event List</CardTitle>
            <CardDescription>
              {listState.list.pagination ? `${listState.list.pagination.total} total` : '—'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {listState.listLoading && <div className="text-sm text-muted-foreground">Loading events...</div>}
            {listState.listError && <div className="text-sm text-red-600">{listState.listError}</div>}
            {!listState.listLoading && !listState.listError && listState.list.events.length === 0 && (
              <div className="text-sm text-muted-foreground">No events found.</div>
            )}
            <div className="space-y-3">
              {listState.list.events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-lg font-semibold">{event.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {event.description || 'No description'}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {formatDate(event.start_at)} → {formatDate(event.end_at)}
                      {event.city ? ` • ${event.city}` : ''}
                      {event.country_code ? ` • ${event.country_code.toUpperCase()}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                      {event.status}
                    </span>
                    <Button variant="secondary" onClick={() => openEdit(event)}>
                      Edit
                    </Button>
                    <Button
                      onClick={() => navigate(`/events/${event.id}`, { state: { event } })}
                      variant="outline"
                    >
                      Open
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {listState.list.pagination && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  disabled={!listState.list.pagination.hasPrev || listState.listLoading}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  Prev
                </Button>
                <div className="text-xs text-muted-foreground">
                  Page {listState.list.pagination.page} / {listState.list.pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  disabled={!listState.list.pagination.hasNext || listState.listLoading}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
