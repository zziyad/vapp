'use client'

import { useState, useEffect } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { vappAccessRequestApi } from '@/lib/services/vapp/vapp-api-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/**
 * Need Info Queue Component
 * Displays requests that need information/corrections
 */
export function NeedInfoQueue({ eventId }) {
  const { client } = useTransport()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])

  useEffect(() => {
    if (!client || !eventId) return

    const loadNeedInfo = async () => {
      try {
        setLoading(true)
        const call = (method, payload) => client.call(method, payload)
        const result = await vappAccessRequestApi.list(call, {
          event_id: eventId,
          status: 'need_info',
          light: true,
          limit: 100,
        })

        if (result?.status === 'fulfilled' && result?.response) {
          setRequests(result.response.requests || [])
        }
      } catch (error) {
        console.error('Failed to load need info requests:', error)
        toast.error('Failed to load requests')
      } finally {
        setLoading(false)
      }
    }

    loadNeedInfo()
  }, [client, eventId])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading requests...</div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No requests need additional information</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Requests Needing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-sm">{req.id?.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-yellow-500">
                        Need Info
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.updated_at ? new Date(req.updated_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/events/${eventId}/vapp/requester/requests/${req.id}`}>
                          Review
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
