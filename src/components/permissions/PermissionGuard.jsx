"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isSuperAdmin,
  PERMISSIONS as CONST,
} from "@/lib/permissions";

export function PermissionGuard({ permission, permissions, requireAll = false, fallback = null, children }) {
  const { user } = useAuth();

  if (isSuperAdmin(user)) return children;

  let ok = false;
  if (permission) ok = hasPermission(user, permission);
  else if (Array.isArray(permissions)) ok = requireAll ? hasAllPermissions(user, permissions) : hasAnyPermission(user, permissions);

  return ok ? children : fallback;
}

export function usePermissions() {
  const { user } = useAuth();

  const can = (permission) => hasPermission(user, permission);
  const canAny = (permissions) => hasAnyPermission(user, permissions);
  const canAll = (permissions) => hasAllPermissions(user, permissions);
  const isSuper = () => isSuperAdmin(user);

  return {
    can,
    canAny,
    canAll,
    isSuper,
    user,
  };
}

export const PERMISSIONS = CONST;

export default PermissionGuard;
