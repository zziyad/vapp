'use client'

import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, FileEdit, Search, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useTransport } from '@/contexts/TransportContext'
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'

const STATUS_COLORS = {
  draft: 'bg-gray-500',
  submitted: 'bg-blue-500',
  under_review: 'bg-orange-500',
  need_info: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  cancelled: 'bg-red-500',
  closed: 'bg-gray-700',
}

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  need_info: 'Need Info',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  closed: 'Closed',
}

/**
 * RequestList Component
 * Displays table of access requests with search and filter
 */
export function RequestList({ eventId, requests, loading, onRefetch }) {
  const { client } = useTransport()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [event, setEvent] = useState(null)
  const [countdowns, setCountdowns] = useState({})

  // Load event for deadline configuration
  const eventAggregate = useMemo(() => {
    if (!client || !eventId) return null
    return getEventAggregate(eventId, client)
  }, [client, eventId])

  useEffect(() => {
    if (!eventAggregate?.events || !eventId) return

    const loadEvent = async () => {
      try {
        await eventAggregate.events.detail(eventId)
      } catch (err) {
        console.error('Failed to load event:', err)
      }
    }

    loadEvent()

    const unsubscribe = eventAggregate.events.subscribe((state) => {
      if (state.detail) {
        setEvent(state.detail)
      }
    })

    return unsubscribe
  }, [eventAggregate, eventId])

  // Update countdown timers for submitted requests
  useEffect(() => {
    if (!event?.settings?.vapp?.request_edit_deadline_hours || !requests) return

    const deadlineHours = event.settings.vapp.request_edit_deadline_hours
    if (deadlineHours <= 0) return

    const updateCountdowns = () => {
      const newCountdowns = {}
      const now = new Date()

      requests.forEach((req) => {
        if (req.status === 'submitted' && req.submitted_at) {
          const submittedAt = new Date(req.submitted_at)
          const deadlineMs = deadlineHours * 60 * 60 * 1000
          const timeSinceSubmission = now.getTime() - submittedAt.getTime()
          const remaining = deadlineMs - timeSinceSubmission
          newCountdowns[req.id] = remaining > 0 ? remaining : 0
        }
      })

      setCountdowns(newCountdowns)
    }

    updateCountdowns()
    const interval = setInterval(updateCountdowns, 1000)

    return () => clearInterval(interval)
  }, [event, requests])

  const filteredRequests = useMemo(() => {
    let filtered = requests || []

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(req => {
        const id = req.id?.toLowerCase() || ''
        return id.includes(searchLower)
      })
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter)
    }

    return filtered
  }, [requests, search, statusFilter])

  const isEditable = (status) => {
    return status === 'draft' || status === 'need_info'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading requests...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by request ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="need_info">Need Info</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Time Remaining</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => {
                  const timeRemaining = countdowns[req.id]
                  const showCountdown = req.status === 'submitted' && req.submitted_at && timeRemaining !== undefined && timeRemaining > 0
                  
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-sm">{req.id?.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={STATUS_COLORS[req.status] || 'bg-gray-500'}
                        >
                          {STATUS_LABELS[req.status] || req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {req.updated_at ? new Date(req.updated_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {showCountdown ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                            <Clock className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-300" />
                            <span className="font-mono font-semibold text-yellow-900 dark:text-yellow-100 text-xs">
                              {Math.floor(timeRemaining / (60 * 60 * 1000))}h{' '}
                              {Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))}m{' '}
                              {Math.floor((timeRemaining % (60 * 1000)) / 1000)}s
                            </span>
                          </div>
                        ) : req.status === 'submitted' && timeRemaining !== undefined && timeRemaining <= 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium">
                            Expired
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/events/${eventId}/vapp/requester/requests/${req.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {(isEditable(req.status) || showCountdown) && (
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/events/${eventId}/vapp/requester/requests/${req.id}`}>
                                <FileEdit className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
