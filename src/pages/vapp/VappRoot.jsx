"use client";

import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Container from "@/components/layout/Container";
import { useAuth } from "@/contexts/AuthContext";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";

/**
 * VAPP Root Page
 * Redirects to appropriate workspace dashboard based on user permissions
 */
export default function VappRoot() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const eventId = useMemo(() => params?.eventId, [params?.eventId]);

  const canOps = useMemo(
    () =>
      hasAnyPermission(user, [
        PERMISSIONS.VAPP.ACCESS_REQUEST.REVIEW_LIST_PENDING,
        PERMISSIONS.VAPP.REVIEW.READ,
        PERMISSIONS.VAPP.PERMIT.GENERATE,
        PERMISSIONS.VAPP.PERMIT.LIST,
      ]),
    [user]
  );

  const canRequester = useMemo(
    () =>
      hasAnyPermission(user, [
        PERMISSIONS.VAPP.ACCESS_REQUEST.CREATE,
        PERMISSIONS.VAPP.ACCESS_REQUEST.LIST,
      ]),
    [user]
  );

  useEffect(() => {
    if (!eventId) return;

    if (canOps) {
      navigate(`/events/${eventId}/vapp/ops/dashboard`, { replace: true });
      return;
    }

    if (canRequester) {
      navigate(`/events/${eventId}/vapp/requester/dashboard`, { replace: true });
      return;
    }

    navigate(`/events/${eventId}/vapp/requester/dashboard`, { replace: true });
  }, [eventId, canOps, canRequester, navigate]);

  if (!eventId) {
    return (
      <Container className="py-6">
        <div className="text-center text-gray-500">Event ID is required</div>
      </Container>
    );
  }

  return (
    <Container className="py-6">
      <div className="text-center py-8 text-muted-foreground">
        Redirecting to workspace...
      </div>
    </Container>
  );
}
