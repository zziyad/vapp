import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { isValidUUID } from '@/lib/utils/uuid'
import Container from '@/components/layout/Container'
import { AdminSidebar } from '@/components/vapp/admin/AdminSidebar'
import { VappPageHeader } from '@/components/vapp/shared/navigation/VappPageHeader'
import { PermissionGuard, PERMISSIONS } from '@/components/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield } from 'lucide-react'

/**
 * RBAC Page (Admin)
 * Manage roles and permissions
 */
export default function RBACPage() {
  const params = useParams()
  const eventId = useMemo(
    () => (Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId),
    [params?.eventId]
  )

  const isEventIdValid = useMemo(() => isValidUUID(eventId), [eventId])

  if (!isEventIdValid) {
    return (
      <Container className="py-6">
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold">Invalid Event ID</h1>
          <p className="text-muted-foreground">Please provide a valid Event ID in the URL.</p>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-6">
      <VappPageHeader
        eventId={eventId}
        pageTitle="RBAC / Permissions"
        pageDescription="Manage roles and permissions for VAPP"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-1">
          <AdminSidebar eventId={eventId} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <PermissionGuard permission={PERMISSIONS.VAPP.CONFIG.READ}>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RBAC / Permissions</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage roles and permissions for VAPP
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Role-Based Access Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    RBAC management functionality coming soon. This will allow you to:
                    <ul className="list-disc list-inside mt-4 text-left max-w-md mx-auto space-y-2">
                      <li>Assign roles to users</li>
                      <li>Manage permissions per role</li>
                      <li>View permission matrix</li>
                      <li>Configure workspace access</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </PermissionGuard>
        </div>
      </div>
    </Container>
  )
}
