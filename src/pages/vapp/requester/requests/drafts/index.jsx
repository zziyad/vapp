import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { isValidUUID } from '@/lib/utils/uuid'
import Container from '@/components/layout/Container'
import { RequesterSidebar } from '@/components/vapp/requester/RequesterSidebar'
import { DraftsList } from '@/components/vapp/requester/requests/DraftsList'
import { VappPageHeader } from '@/components/vapp/shared/navigation/VappPageHeader'

/**
 * Drafts Page (Requester Portal)
 * List of draft requests
 */
export default function DraftsPage() {
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
        pageTitle="Drafts"
        pageDescription="Continue editing your draft requests"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <RequesterSidebar eventId={eventId} />
        </div>

        <div className="lg:col-span-3">
          <DraftsList eventId={eventId} />
        </div>
      </div>
    </Container>
  )
}
