import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { isValidUUID } from '@/lib/utils/uuid'
import Container from '@/components/layout/Container'
import { RequesterSidebar } from '@/components/vapp/requester/RequesterSidebar'
import { TermsAcceptanceClient } from './TermsAcceptanceClient'
import { VappPageHeader } from '@/components/vapp/shared/navigation/VappPageHeader'

/**
 * Terms Acceptance Page (Requester Portal)
 * Accept terms and conditions for a permit
 */
export default function TermsAcceptancePage() {
  const params = useParams()
  const eventId = useMemo(
    () => (Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId),
    [params?.eventId]
  )
  const permitId = useMemo(
    () => (Array.isArray(params?.permitId) ? params.permitId[0] : params?.permitId),
    [params?.permitId]
  )

  const isEventIdValid = useMemo(() => isValidUUID(eventId), [eventId])
  const isPermitIdValid = useMemo(() => isValidUUID(permitId), [permitId])

  if (!isEventIdValid || !isPermitIdValid) {
    return (
      <Container className="py-6">
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold">Invalid Event ID or Permit ID</h1>
          <p className="text-muted-foreground">Please provide valid IDs in the URL.</p>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-6">
      <VappPageHeader 
        eventId={eventId}
        pageTitle="Accept Terms & Conditions"
        pageDescription="Review and accept terms to activate your permit"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <RequesterSidebar eventId={eventId} />
        </div>

        <div className="lg:col-span-3">
          <TermsAcceptanceClient eventId={eventId} permitId={permitId} />
        </div>
      </div>
    </Container>
  )
}
