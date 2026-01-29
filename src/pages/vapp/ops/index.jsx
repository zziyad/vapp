"use client";

import { Navigate, useParams } from "react-router-dom";
import { useMemo } from "react";

/**
 * Ops root entry.
 * Redirects to the dashboard route.
 */
export default function OpsIndexPage() {
  const params = useParams();
  const eventId = useMemo(
    () => (Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId),
    [params?.eventId]
  );

  if (!eventId) {
    return <div className="text-center text-gray-500">Event ID is required</div>;
  }

  return <Navigate to={`/events/${eventId}/vapp/ops/dashboard`} replace />;
}
