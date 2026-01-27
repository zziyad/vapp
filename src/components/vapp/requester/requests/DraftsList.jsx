'use client'

import { useState, useEffect } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { vappAccessRequestApi } from '@/lib/services/vapp/vapp-api-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileEdit, ArrowRight, Trash2 } from 'lucide-react'
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
 * Drafts List Component
 * Displays list of draft requests
 */
export function DraftsList({ eventId }) {
  const { client } = useTransport()
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState([])

  useEffect(() => {
    if (!client || !eventId) return

    const loadDrafts = async () => {
      try {
        setLoading(true)
        const call = (method, payload) => client.call(method, payload)
        const result = await vappAccessRequestApi.list(call, {
          event_id: eventId,
          status: 'draft',
          light: true,
          limit: 100,
        })

        if (result?.status === 'fulfilled' && result?.response) {
          setDrafts(result.response.requests || [])
        }
      } catch (error) {
        console.error('Failed to load drafts:', error)
        toast.error('Failed to load drafts')
      } finally {
        setLoading(false)
      }
    }

    loadDrafts()
  }, [client, eventId])

  const handleDelete = async (requestId) => {
    if (!client || !eventId) return
    if (!confirm('Are you sure you want to delete this draft?')) return

    try {
      const call = (method, payload) => client.call(method, payload)
      await vappAccessRequestApi.deleteDraft(call, eventId, requestId)
      toast.success('Draft deleted')
      setDrafts(drafts.filter(d => d.id !== requestId))
    } catch (error) {
      console.error('Failed to delete draft:', error)
      toast.error('Failed to delete draft')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading drafts...</div>
        </CardContent>
      </Card>
    )
  }

  if (drafts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No draft requests found</p>
          <Button asChild>
            <Link to={`/events/${eventId}/vapp/requester/requests/new`}>
              Create New Request
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Draft Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell className="font-mono text-sm">{draft.id?.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {draft.created_at ? new Date(draft.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {draft.updated_at ? new Date(draft.updated_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/events/${eventId}/vapp/requester/requests/${draft.id}`}>
                            <FileEdit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(draft.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
