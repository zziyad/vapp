import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTransport } from '@/contexts/TransportContext'
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

export default function EventDetail() {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const location = useLocation()
  const { client } = useTransport()

  const aggregate = useMemo(() => {
    if (!client) return null
    return getEventAggregate(eventId, client)
  }, [client, eventId])

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const eventRef = useRef(null)

  useEffect(() => {
    if (!aggregate?.events) return
    return aggregate.events.subscribe((state) => {
      setLoading(state.detailLoading)
      setError(state.detailError)
      if (state.detail) {
        setEvent(state.detail)
      }
    })
  }, [aggregate])

  useEffect(() => {
    eventRef.current = event
  }, [event])

  useEffect(() => {
    if (location?.state?.event) {
      setEvent(location.state.event)
      setError('')
      if (aggregate?.events) {
        aggregate.events.setDetail(location.state.event)
      }
    }
  }, [location?.state?.event, aggregate])

  const fetchEvent = useCallback(async () => {
    if (!aggregate?.events || !eventId) return
    try {
      await aggregate.events.detail(eventId)
    } catch (err) {
      if (!eventRef.current && !location?.state?.event) {
        setError(err?.message || 'Failed to load event')
      }
    }
  }, [aggregate, eventId, location?.state?.event])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {event?.name || 'Event'}
            </h1>
            <p className="text-muted-foreground">
              {event?.description || 'Event overview'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/events')}>
              Back to Events
            </Button>
            {eventId && (
              <Button variant="default" onClick={() => navigate(`/events/${eventId}/vapp`)}>
                Go to VAPP
              </Button>
            )}
            <Button onClick={fetchEvent} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Loading event...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {event && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>Core event metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Status:</span> {event.status}</div>
                <div><span className="text-muted-foreground">Organizer:</span> {event.organizer_name || '-'}</div>
                <div><span className="text-muted-foreground">Timezone:</span> {event.timezone}</div>
                <div><span className="text-muted-foreground">Guests:</span> {event.expected_guests}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Dates and timeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Start:</span> {formatDateTime(event.start_at)}</div>
                <div><span className="text-muted-foreground">End:</span> {formatDateTime(event.end_at)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>Venue and city</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">City:</span> {event.city || '-'}</div>
                <div><span className="text-muted-foreground">Country:</span> {event.country_code || '-'}</div>
                <div><span className="text-muted-foreground">Hotels:</span> {event.hotels?.join(', ') || '-'}</div>
                <div><span className="text-muted-foreground">Venues:</span> {event.venues?.join(', ') || '-'}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capacity</CardTitle>
                <CardDescription>Operational limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Max VAPP:</span> {event.max_vapp}</div>
                <div><span className="text-muted-foreground">Max Fleet:</span> {event.max_fleet}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
