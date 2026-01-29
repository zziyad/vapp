"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "./PermissionGuard";

/**
 * Button component with built-in permission checking
 * 
 * @example
 * <ConditionalButton 
 *   permission={PERMISSIONS.VAPP.REVIEW.APPROVE}
 *   onClick={handleApprove}
 * >
 *   Approve
 * </ConditionalButton>
 */
export const ConditionalButton = memo(function ConditionalButton({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
  ...props
}) {
  return (
    <PermissionGuard
      permission={permission}
      permissions={permissions}
      requireAll={requireAll}
      fallback={fallback}
    >
      <Button {...props}>
        {children}
      </Button>
    </PermissionGuard>
  );
});

export default ConditionalButton;
