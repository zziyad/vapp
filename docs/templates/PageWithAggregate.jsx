/**
 * Template: Page Using Aggregate Pattern
 * 
 * This is a complete template showing how to use the Aggregate Pattern
 * for data fetching in a page component.
 * 
 * Copy this template and adapt it for your needs.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTransport } from '@/contexts/TransportContext'
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'
// Import your UI components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Page Component Using Aggregate Pattern
 * 
 * This example shows:
 * - Detail view (single item)
 * - List view (multiple items)
 * - Create/Update operations
 * - Error handling
 * - Loading states
 * - Optimistic updates
 */
export default function MyPage() {
  // ========================================
  // 1. GET DEPENDENCIES
  // ========================================
  const navigate = useNavigate()
  const { eventId } = useParams() // or get from props
  const location = useLocation()
  const { client } = useTransport()

  // ========================================
  // 2. CREATE AGGREGATE (with caching)
  // ========================================
  const aggregate = useMemo(() => {
    if (!client) return null
    // Pass null for list mode, eventId for detail mode
    return getEventAggregate(eventId, client)
  }, [client, eventId])

  // ========================================
  // 3. LOCAL STATE FOR UI
  // ========================================
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Use ref to prevent infinite loops
  const eventRef = useRef(null)

  // ========================================
  // 4. SUBSCRIBE TO AGGREGATE STATE
  // ========================================
  useEffect(() => {
    if (!aggregate?.events) return
    
    // Subscribe to state changes
    // This will be called whenever aggregate state changes
    return aggregate.events.subscribe((state) => {
      setLoading(state.detailLoading) // or state.listLoading
      setError(state.detailError) // or state.listError
      if (state.detail) {
        setEvent(state.detail)
      }
    })
  }, [aggregate])

  // ========================================
  // 5. UPDATE REF (prevent loops)
  // ========================================
  useEffect(() => {
    eventRef.current = event
  }, [event])

  // ========================================
  // 6. HANDLE INITIAL DATA FROM LOCATION STATE
  // ========================================
  useEffect(() => {
    if (location?.state?.event) {
      setEvent(location.state.event)
      setError('')
      if (aggregate?.events) {
        aggregate.events.setDetail(location.state.event)
      }
    }
  }, [location?.state?.event, aggregate])

  // ========================================
  // 7. FETCH FUNCTION
  // ========================================
  const fetchEvent = useCallback(async () => {
    if (!aggregate?.events || !eventId) return
    
    try {
      await aggregate.events.detail(eventId)
      // State will be updated via subscription
      // No need to manually set loading/error
    } catch (err) {
      // Only set error if we don't have data
      if (!eventRef.current && !location?.state?.event) {
        setError(err?.message || 'Failed to load event')
      }
    }
  }, [aggregate, eventId, location?.state?.event])
  // Note: Don't include 'event' in dependencies to prevent loops

  // ========================================
  // 8. TRIGGER FETCH
  // ========================================
  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  // ========================================
  // 9. MUTATION FUNCTIONS (Create/Update/Delete)
  // ========================================
  const handleCreate = useCallback(async (formData) => {
    if (!aggregate?.events) return
    
    try {
      const created = await aggregate.events.create(formData)
      // Success - navigate or show message
      navigate(`/events/${created.id}`)
    } catch (err) {
      setError(err?.message || 'Failed to create event')
    }
  }, [aggregate, navigate])

  const handleUpdate = useCallback(async (id, formData) => {
    if (!aggregate?.events) return
    
    try {
      await aggregate.events.update({ id, data: formData })
      // Success - state updated via subscription
    } catch (err) {
      setError(err?.message || 'Failed to update event')
    }
  }, [aggregate])

  // ========================================
  // 10. RENDER UI
  // ========================================
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{event?.name || 'Loading...'}</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/events')}>
              Back
            </Button>
            <Button onClick={fetchEvent} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-sm text-muted-foreground">
            Loading event...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        {/* Data Display */}
        {event && (
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div><strong>Name:</strong> {event.name}</div>
                <div><strong>Description:</strong> {event.description}</div>
                {/* Add more fields */}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

/**
 * ALTERNATIVE: List View Pattern
 */
export function EventsListPage() {
  const { client } = useTransport()
  
  // Aggregate for list (pass null as eventId)
  const aggregate = useMemo(() => {
    if (!client) return null
    return getEventAggregate(null, client)
  }, [client])

  const [listState, setListState] = useState({
    list: { events: [], pagination: null },
    listLoading: false,
    listError: '',
  })

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
  })

  // Subscribe to list state
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

  // Fetch with filters
  const fetchEvents = useCallback(async () => {
    if (!aggregate?.events) return
    await aggregate.events.list(filters)
  }, [aggregate, filters])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return (
    <div>
      {/* Filters */}
      <input
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
        placeholder="Search..."
      />

      {/* List */}
      {listState.listLoading && <div>Loading...</div>}
      {listState.listError && <div>{listState.listError}</div>}
      {listState.list.events.map((event) => (
        <div key={event.id}>{event.name}</div>
      ))}

      {/* Pagination */}
      {listState.list.pagination && (
        <div>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={!listState.list.pagination.hasPrev}
          >
            Previous
          </button>
          <span>
            Page {listState.list.pagination.page} of {listState.list.pagination.totalPages}
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={!listState.list.pagination.hasNext}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
