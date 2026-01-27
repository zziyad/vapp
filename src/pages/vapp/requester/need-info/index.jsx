import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { isValidUUID } from '@/lib/utils/uuid'
import Container from '@/components/layout/Container'
import { RequesterSidebar } from '@/components/vapp/requester/RequesterSidebar'
import { NeedInfoQueue } from '@/components/vapp/requester/need-info/NeedInfoQueue'
import { WorkspaceTabs } from '@/components/vapp/shared/navigation/WorkspaceTabs'

/**
 * Need Info Page (Requester Portal)
 * List of requests that need information/corrections
 */
export default function NeedInfoPage() {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Need Info</h1>
        <p className="text-gray-600 mb-4">Requests that need additional information or corrections</p>
        <WorkspaceTabs eventId={eventId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <RequesterSidebar eventId={eventId} />
        </div>

        <div className="lg:col-span-3">
          <NeedInfoQueue eventId={eventId} />
        </div>
      </div>
    </Container>
  )
}
