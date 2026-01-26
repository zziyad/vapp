"use client";

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Container from "@/components/layout/Container";
import { OpsSidebar } from "@/components/vapp/ops/OpsSidebar";
import { OpsDashboard } from "@/components/vapp/ops/dashboard/OpsDashboard";
import { VappPageHeader } from "@/components/vapp/shared/navigation/VappPageHeader";

export default function OpsDashboardPage() {
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
        pageDescription="Overview of operations and requests"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <OpsSidebar eventId={eventId} />
        </div>

        <div className="lg:col-span-3">
          <OpsDashboard eventId={eventId} />
        </div>
      </div>
    </Container>
  );
}
