"use client";

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Container from "@/components/layout/Container";
import { RequesterSidebar } from "@/components/vapp/requester/RequesterSidebar";
import { RequesterDashboard } from "@/components/vapp/requester/dashboard/RequesterDashboard";
import { VappPageHeader } from "@/components/vapp/shared/navigation/VappPageHeader";

export default function RequesterDashboardPage() {
  const params = useParams();
  const eventId = useMemo(() => params?.eventId, [params?.eventId]);

  if (!eventId) {
    return (
      <Container className="py-6">
        <div className="text-center text-gray-500">Event ID is required</div>
      </Container>
    );
  }

  return (
    <Container className="py-6">
      <VappPageHeader
        eventId={eventId}
        pageTitle="Dashboard"
        pageDescription="Overview of requests and submissions"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <RequesterSidebar eventId={eventId} />
        </div>

        <div className="lg:col-span-3">
          <RequesterDashboard eventId={eventId} />
        </div>
      </div>
    </Container>
  );
}
