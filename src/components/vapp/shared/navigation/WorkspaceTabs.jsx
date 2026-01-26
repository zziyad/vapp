"use client";

import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions, PERMISSIONS } from "@/components/permissions";

const WORKSPACE_LABELS = {
  requester: "Requester Portal",
  ops: "Operations Console",
  admin: "Manager / Config",
};

export function WorkspaceTabs({ eventId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermissions();

  const accessibleWorkspaces = [];
  if (can(PERMISSIONS.VAPP.ACCESS_REQUEST.CREATE) || can(PERMISSIONS.VAPP.ACCESS_REQUEST.LIST)) {
    accessibleWorkspaces.push("requester");
  }
  if (
    can(PERMISSIONS.VAPP.ACCESS_REQUEST.REVIEW_LIST_PENDING) ||
    can(PERMISSIONS.VAPP.REVIEW.READ) ||
    can(PERMISSIONS.VAPP.PERMIT.GENERATE) ||
    can(PERMISSIONS.VAPP.PERMIT.LIST)
  ) {
    accessibleWorkspaces.push("ops");
  }
  if (can(PERMISSIONS.VAPP.CONFIG.READ)) {
    accessibleWorkspaces.push("admin");
  }

  const currentWorkspace = (() => {
    const match = location?.pathname?.match(/\/vapp\/(requester|ops|admin)/);
    return match ? match[1] : null;
  })();

  if (accessibleWorkspaces.length <= 1) {
    return null;
  }

  const handleTabChange = (value) => {
    if (value !== currentWorkspace) {
      const dashboardPath = `/events/${eventId}/vapp/${value}/dashboard`;
      navigate(dashboardPath);
    }
  };

  return (
    <Tabs value={currentWorkspace || ""} onValueChange={handleTabChange} className="w-full">
      <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground">
        {accessibleWorkspaces.map((ws) => (
          <TabsTrigger
            key={ws}
            value={ws}
            className="data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            {WORKSPACE_LABELS[ws]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
