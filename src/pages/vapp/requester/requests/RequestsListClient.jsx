'use client'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { RequestList } from '@/components/vapp/requests/RequestList'
import { useAccessRequests } from '@/hooks/use-access-requests'
import { PermissionGuard, PERMISSIONS } from '@/components/permissions'

/**
 * Requests List Client Component
 * Displays list of user's access requests
 */
export function RequestsListClient({ eventId }) {
  const [filters, setFilters] = useState({})
  const { loading, requests, total, error, refetch } = useAccessRequests(eventId, filters)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage your access requests
          </p>
        </div>
        <PermissionGuard permission={PERMISSIONS.VAPP.ACCESS_REQUEST.CREATE}>
          <Button asChild>
            <Link to={`/events/${eventId}/vapp/requester/requests/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Create Request
            </Link>
          </Button>
        </PermissionGuard>
      </div>

      {/* Requests List */}
      <RequestList
        eventId={eventId}
        requests={requests}
        loading={loading}
        onRefetch={refetch}
      />
    </div>
  )
}
