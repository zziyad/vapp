'use client'

import { useState, useEffect, useRef } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { vappDashboardApi } from '@/lib/services/vapp/vapp-api-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FilePlus, FileEdit, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePermissions, PERMISSIONS } from '@/components/permissions'
import { useEventReadiness } from '@/hooks/use-event-readiness'

/**
 * Requester Dashboard Component
 * Main dashboard showing request statistics and quick actions
 */
export function RequesterDashboard({ eventId }) {
  const { client } = useTransport()
  const { can } = usePermissions()
  const { readiness } = useEventReadiness(eventId)

  const [stats, setStats] = useState({
    drafts: 0,
    submitted: 0,
    needInfo: 0,
    approved: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)
  const isLoadingRef = useRef(false)

  // Load request statistics
  useEffect(() => {
    if (!client || !eventId || isLoadingRef.current) return

    const loadStats = async () => {
      isLoadingRef.current = true
      try {
        setLoading(true)
        const call = (method, payload) => client.call(method, payload)
        const result = await vappDashboardApi.stats(call, eventId)
        const s = result?.response?.requester || {}

        setStats({
          drafts: s.drafts || 0,
          submitted: s.submitted || 0,
          needInfo: s.needInfo || 0,
          approved: s.approved || 0,
          rejected: s.rejected || 0,
        })
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
      } finally {
        setLoading(false)
        isLoadingRef.current = false
      }
    }

    loadStats()
  }, [client, eventId])

  const canCreate = can(PERMISSIONS.VAPP.ACCESS_REQUEST.CREATE)
  const canSubmit = readiness === 'READY' && canCreate

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Requester Portal</h1>
        <p className="text-sm text-gray-600 mt-1">
          Create and manage your access requests
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.drafts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : stats.submitted}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Need Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? '...' : stats.needInfo}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : stats.approved}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? '...' : stats.rejected}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilePlus className="h-5 w-5" />
              Create Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new access request for vehicle permits
            </p>
            <Button asChild disabled={!canCreate}>
              <Link to={`/events/${eventId}/vapp/requester/requests/new`}>
                <FilePlus className="h-4 w-4 mr-2" />
                Create New Request
              </Link>
            </Button>
          </CardContent>
        </Card>

        {stats.drafts > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileEdit className="h-5 w-5" />
                Continue Draft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You have {stats.drafts} draft request{stats.drafts !== 1 ? 's' : ''} to complete
              </p>
              <Button asChild variant="outline">
                <Link to={`/events/${eventId}/vapp/requester/requests/drafts`}>
                  <FileEdit className="h-4 w-4 mr-2" />
                  View Drafts
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {stats.needInfo > 0 && (
          <Card className="hover:shadow-md transition-shadow border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900">
                <AlertCircle className="h-5 w-5" />
                Need Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {stats.needInfo} request{stats.needInfo !== 1 ? 's' : ''} need{stats.needInfo === 1 ? 's' : ''} your attention
              </p>
              <Button asChild variant="outline">
                <Link to={`/events/${eventId}/vapp/requester/need-info`}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Review Requests
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
