import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { isValidUUID } from '@/lib/utils/uuid'
import Container from '@/components/layout/Container'
import { AdminSidebar } from '@/components/vapp/admin/AdminSidebar'
import { VappPageHeader } from '@/components/vapp/shared/navigation/VappPageHeader'
import { PermissionGuard, PERMISSIONS } from '@/components/permissions'
import { ConfigSetupWizard } from '@/components/vapp/config/ConfigSetupWizard'

/**
 * Event Setup Page (Admin)
 * Event configuration wizard
 */
export default function EventSetupPage() {
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
        pageTitle="Event Setup"
        pageDescription="Configure event-specific VAPP settings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-1">
          <AdminSidebar eventId={eventId} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <PermissionGuard permission={PERMISSIONS.VAPP.CONFIG.WRITE || PERMISSIONS.VAPP.CONFIG.READ}>
            <ConfigSetupWizard eventId={eventId} />
          </PermissionGuard>
        </div>
      </div>
    </Container>
  )
}
