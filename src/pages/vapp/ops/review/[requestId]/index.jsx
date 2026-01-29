"use client";

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { isValidUUID } from "@/lib/utils/uuid";
import Container from "@/components/layout/Container";
import { OpsSidebar } from "@/components/vapp/ops/OpsSidebar";
import { ReviewDetail } from "@/components/vapp/ops/review/ReviewDetail";
import { VappPageHeader } from "@/components/vapp/shared/navigation/VappPageHeader";
import { PermissionGuard, PERMISSIONS } from "@/components/permissions";

/**
 * Review Detail Page (Ops Console)
 * Page for reviewing a specific access request
 */
export default function OpsReviewDetailPage() {
  const params = useParams();
  const eventId = useMemo(
    () => (Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId),
    [params?.eventId]
  );
  const requestId = useMemo(
    () => (Array.isArray(params?.requestId) ? params.requestId[0] : params?.requestId),
    [params?.requestId]
  );

  const isEventIdValid = useMemo(() => isValidUUID(eventId), [eventId]);
  const isRequestIdValid = useMemo(() => isValidUUID(requestId), [requestId]);

  if (!isEventIdValid || !isRequestIdValid) {
    return (
      <Container className="py-6">
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold">Invalid Event ID or Request ID</h1>
          <p className="text-muted-foreground">
            Please provide valid Event ID and Request ID in the URL.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-6">
      <VappPageHeader
        eventId={eventId}
        pageTitle="Review Request"
        pageDescription="Review and make decisions on access requests"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-1">
          <OpsSidebar eventId={eventId} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <PermissionGuard permission={PERMISSIONS.VAPP.REVIEW.READ}>
            <ReviewDetail eventId={eventId} requestId={requestId} />
          </PermissionGuard>
        </div>
      </div>
    </Container>
  );
}
