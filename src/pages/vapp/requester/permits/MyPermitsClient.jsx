'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransport } from '@/contexts/TransportContext'
import { toast } from 'sonner'
import { vappPermitApi } from '@/lib/services/vapp/vapp-api-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react'
import { StatusBadge } from '@/components/vapp/shared/StatusBadge'

/**
 * My Permits Client Component
 * Displays list of permits for the authenticated requester
 */
export function MyPermitsClient({ eventId }) {
  const { client } = useTransport()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [permits, setPermits] = useState([])
  const [statusFilter, setStatusFilter] = useState(null) // null = all, 'pending_terms_acceptance', 'terms_accepted'

  const loadPermits = useCallback(async () => {
    if (!eventId || !client) return

    setLoading(true)
    try {
      const call = (method, payload) => client.call(method, payload)
      const result = await vappPermitApi.listForRequester(call, eventId, statusFilter)

      if (result?.status === 'fulfilled' && result?.response?.permits) {
        setPermits(result.response.permits)
      } else {
        setPermits([])
        toast.error('Failed to load permits')
      }
    } catch (error) {
      console.error('Failed to load permits:', error)
      toast.error('Failed to load permits')
      setPermits([])
    } finally {
      setLoading(false)
    }
  }, [eventId, client, statusFilter])

  useEffect(() => {
    loadPermits()
  }, [loadPermits])

  const getLifecycleStage = (permit) => {
    const meta = permit.meta || {}
    const parsedMeta = typeof meta === 'string' ? (() => {
      try { return JSON.parse(meta); } catch { return {}; }
    })() : meta
    return parsedMeta?.lifecycle?.stage || 'generated'
  }

  // Check if terms have been sent (terms_sent_at must exist)
  const hasTermsSent = (permit) => {
    const meta = permit.meta || {}
    const parsedMeta = typeof meta === 'string' ? (() => {
      try { return JSON.parse(meta); } catch { return {}; }
    })() : meta
    return !!parsedMeta?.terms_sent_at
  }

  const getStatusBadge = (permit) => {
    const stage = getLifecycleStage(permit)
    // Only show "Terms Pending" if terms have been sent (terms_sent_at exists)
    if (stage === 'pending_terms_acceptance' && hasTermsSent(permit)) {
      return <Badge variant="outline" className="flex items-center gap-1 bg-orange-100 text-orange-700 border-orange-300"><Clock className="h-3 w-3" /> Terms Pending</Badge>
    }
    if (stage === 'terms_accepted') {
      return <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-300"><CheckCircle className="h-3 w-3" /> Active</Badge>
    }
    // If pending but terms not sent yet, show as "Generated"
    if (stage === 'pending_terms_acceptance' && !hasTermsSent(permit)) {
      return <Badge variant="secondary">Generated</Badge>
    }
    return <Badge variant="secondary">{stage}</Badge>
  }

  // Only count as pending if terms have been sent
  const pendingCount = permits.filter(p => {
    const stage = getLifecycleStage(p)
    return stage === 'pending_terms_acceptance' && hasTermsSent(p)
  }).length
  const activeCount = permits.filter(p => getLifecycleStage(p) === 'terms_accepted').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Permits</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage your permits
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Permits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permits.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={statusFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(null)}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'pending_terms_acceptance' ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter('pending_terms_acceptance')}
        >
          Pending Terms ({pendingCount})
        </Button>
        <Button
          variant={statusFilter === 'terms_accepted' ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter('terms_accepted')}
        >
          Active ({activeCount})
        </Button>
      </div>

      {/* Permits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Permits</CardTitle>
          <CardDescription>
            {statusFilter === 'pending_terms_acceptance' && 'Permits requiring terms acceptance'}
            {statusFilter === 'terms_accepted' && 'Active permits'}
            {!statusFilter && 'All your permits'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading permits...</div>
          ) : permits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {statusFilter ? 'No permits found with this status' : 'No permits found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permits.map((permit) => {
                  const stage = getLifecycleStage(permit)
                  const serialNumber = permit.meta?.serial_number || permit.id?.slice(0, 8)
                  
                  return (
                    <TableRow key={permit.id}>
                      <TableCell className="font-mono">{serialNumber}</TableCell>
                      <TableCell>{getStatusBadge(permit)}</TableCell>
                      <TableCell>
                        {permit.request_id ? (
                          <span className="font-mono text-sm text-muted-foreground">
                            {permit.request_id.slice(0, 8)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {/* Only show "Accept Terms" if terms have been sent (terms_sent_at exists) */}
                        {stage === 'pending_terms_acceptance' && hasTermsSent(permit) ? (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/events/${eventId}/vapp/requester/permits/${permit.id}/accept-terms`)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Accept Terms
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/events/${eventId}/vapp/requester/permits/${permit.id}`)}
                          >
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
