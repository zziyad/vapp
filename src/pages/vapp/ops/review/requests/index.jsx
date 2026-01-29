"use client";

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { isValidUUID } from "@/lib/utils/uuid";
import Container from "@/components/layout/Container";
import { OpsSidebar } from "@/components/vapp/ops/OpsSidebar";
import { ReviewRequests } from "@/components/vapp/ops/review/ReviewRequests";
import { VappPageHeader } from "@/components/vapp/shared/navigation/VappPageHeader";
import { PermissionGuard, PERMISSIONS } from "@/components/permissions";

/**
 * Review Requests Page (Ops Console)
 * Combined page for viewing approved, rejected, and need_info requests with status filtering
 */
export default function ReviewRequestsPage() {
  const params = useParams();
  const eventId = useMemo(
    () => (Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId),
    [params?.eventId]
  );

  const isEventIdValid = useMemo(() => isValidUUID(eventId), [eventId]);

  if (!isEventIdValid) {
    return (
      <Container className="py-6">
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold">Invalid Event ID</h1>
          <p className="text-muted-foreground">Please provide a valid Event ID in the URL.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-6">
      <VappPageHeader
        eventId={eventId}
        pageTitle="Review Requests"
        pageDescription="View approved, rejected, and requests needing information"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-1">
          <OpsSidebar eventId={eventId} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <PermissionGuard permission={PERMISSIONS.VAPP.REVIEW.READ}>
            <ReviewRequests eventId={eventId} />
          </PermissionGuard>
        </div>
      </div>
    </Container>
  );
}
