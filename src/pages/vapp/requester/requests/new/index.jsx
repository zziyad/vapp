import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { isValidUUID } from '@/lib/utils/uuid'
import Container from '@/components/layout/Container'
import { RequesterSidebar } from '@/components/vapp/requester/RequesterSidebar'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RequesterAccessRequestForm } from '@/components/vapp/requester/RequesterAccessRequestForm'
import { PermissionGuard, PERMISSIONS } from '@/components/permissions'
import { WorkspaceTabs } from '@/components/vapp/shared/navigation/WorkspaceTabs'

/**
 * Create Request Page (Requester Portal)
 * Wizard for creating new access request
 */
export default function CreateRequestPage() {
  const params = useParams()
  const navigate = useNavigate()
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
    <PermissionGuard permission={PERMISSIONS.VAPP.ACCESS_REQUEST.CREATE}>
      <Container className="py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Request</h1>
          <p className="text-gray-600 mb-4">Fill out the form to create a new access request</p>
          <WorkspaceTabs eventId={eventId} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <RequesterSidebar eventId={eventId} />
          </div>

          <div className="lg:col-span-3">
            <div className="space-y-6">
              <div>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/events/${eventId}/vapp/requester/requests`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Requests
                  </Link>
                </Button>
              </div>

              <RequesterAccessRequestForm
                eventId={eventId}
                mode="create"
                onDone={() => {
                  navigate(`/events/${eventId}/vapp/requester/requests`)
                }}
              />
            </div>
          </div>
        </div>
      </Container>
    </PermissionGuard>
  )
}
