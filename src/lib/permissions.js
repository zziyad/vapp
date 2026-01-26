"use client";

export const PERMISSIONS = {
  EVENT: {
    CREATE: "event.create",
    READ: "event.read",
    UPDATE: "event.update",
    DELETE: "event.delete",
    VENUE_LIST: "venue.list",
    VENUE_CREATE: "venue.create",
    VENUE_UPDATE: "venue.update",
    VENUE_DELETE: "venue.remove",
    HOTEL_LIST: "hotel.list",
    HOTEL_CREATE: "hotel.create",
    HOTEL_UPDATE: "hotel.update",
    HOTEL_DELETE: "hotel.remove",
  },
  USER: {
    CREATE: "user.create",
    READ: "user.read",
    UPDATE: "user.update",
    DELETE: "user.delete",
    ASSIGN_ROLES: "user.assign_roles",
  },
  FLIGHT_SCHEDULE: {
    CREATE: "flight_schedule.create",
    READ: "flight_schedule.read",
    UPDATE: "flight_schedule.update",
    DELETE: "flight_schedule.delete",
    UPLOAD: "flight_schedule.upload",
  },
  REPORT: {
    CREATE: "report.create",
    READ: "report.read",
    UPDATE: "report.update",
    DELETE: "report.delete",
    STATISTICS: "report.statistics",
  },
  DRIVER: {
    CREATE: "driver.create",
    READ: "driver.read",
    UPDATE: "driver.update",
    DELETE: "driver.delete",
  },
  FLEET_LABEL: {
    CREATE: "fleet_label.create",
    READ: "fleet_label.read",
    UPDATE: "fleet_label.update",
    DELETE: "fleet_label.delete",
    STATISTICS: "fleet_label.statistics",
  },
  FLEET: {
    CREATE: "fleet.create",
    READ: "fleet.read",
    UPDATE: "fleet.update",
    DELETE: "fleet.delete",
    STATISTICS: "fleet.statistics",
    COMMISSION: "fleet.commission",
    DECOMMISSION: "fleet.decommission",
  },
  FLEET_COMMISSIONING: {
    CREATE: "fleet_commissioning.create",
    READ: "fleet_commissioning.read",
    UPDATE: "fleet_commissioning.update",
    DELETE: "fleet_commissioning.delete",
    DECOMMISSION: "fleet_commissioning.decommission",
    STATISTICS: "fleet_commissioning.statistics",
  },
  GUEST: {
    CREATE: "guest.create",
    READ: "guest.read",
    UPDATE: "guest.update",
    DELETE: "guest.delete",
  },
  TASK: {
    CREATE: "task.create",
    READ: "task.read",
    UPDATE: "task.update",
    DELETE: "task.delete",
    COMMENT: "task.comment",
    VIEW_HISTORY: "task.view_history",
  },
  VAPP: {
    ACCESS_REQUEST: {
      CREATE: "vapp.accessRequest.create",
      GET: "vapp.accessRequest.get",
      LIST: "vapp.accessRequest.list",
      UPDATE: "vapp.accessRequest.update",
      CANCEL: "vapp.accessRequest.cancel",
      ITEM_ADD: "vapp.accessRequest.itemAdd",
      ITEM_LIST: "vapp.accessRequest.itemList",
      ITEM_REMOVE: "vapp.accessRequest.itemRemove",
      ITEM_UPDATE: "vapp.accessRequest.itemUpdate",
      VEHICLE_ADD: "vapp.accessRequest.vehicleAdd",
      VEHICLE_LIST: "vapp.accessRequest.vehicleList",
      VEHICLE_REMOVE: "vapp.accessRequest.vehicleRemove",
      VEHICLE_UPDATE: "vapp.accessRequest.vehicleUpdate",
      SUBMIT: "vapp.accessRequest.submit",
      VALIDATE_DRAFT: "vapp.accessRequest.validateDraft",
      RESUBMIT: "vapp.accessRequest.resubmit",
      REVIEW_APPROVE: "vapp.accessRequest.reviewApprove",
      REVIEW_PARTIAL_APPROVE: "vapp.accessRequest.reviewPartialApprove",
      REVIEW_REJECT: "vapp.accessRequest.reviewReject",
      REVIEW_NEED_INFO: "vapp.accessRequest.reviewNeedInfo",
      REVIEW_LIST_PENDING: "vapp.accessRequest.reviewListPending",
      REVIEW_GET_DETAILS: "vapp.accessRequest.reviewGetDetails",
      REVIEW_VALIDATE_MATRIX: "vapp.accessRequest.reviewValidateMatrix",
      REVIEW_CHECK_CAPACITY: "vapp.accessRequest.reviewCheckCapacity",
    },
    PERMIT: {
      GET: "vapp.permit.get",
      LIST: "vapp.permit.list",
      HISTORY: "vapp.permit.history",
      GENERATE: "vapp.permit.generate",
      VERIFY_SECURE: "vapp.permit.verifySecure",
      ISSUE: "vapp.permit.issue",
      DISTRIBUTION_MARK_DISTRIBUTED: "vapp.permit.distributionMarkDistributed",
      DISTRIBUTION_CONFIRM_BY_OWNER: "vapp.permit.distributionConfirmByOwner",
      DISTRIBUTION_LIST_READY: "vapp.permit.distributionListReady",
      PRINT_LIST_PENDING: "vapp.permit.printListPending",
      PRINT_BATCH_CREATE: "vapp.permit.printBatchCreate",
      PRINT_BATCH_GET: "vapp.permit.printBatchGet",
      PRINT_CONFIRM_PRINTED: "vapp.permit.printConfirmPrinted",
      CANCEL: "vapp.permit.cancel",
      SUSPEND: "vapp.permit.suspend",
      REACTIVATE: "vapp.permit.reactivate",
      REPLACE: "vapp.permit.replace",
    },
    PERMIT_TYPE: {
      CREATE: "vapp.permitType.create",
      GET: "vapp.permitType.get",
      LIST: "vapp.permitType.list",
      UPDATE: "vapp.permitType.update",
      DEACTIVATE: "vapp.permitType.deactivate",
    },
    PERMIT_POLICY: {
      CREATE: "vapp.permitPolicy.create",
      GET: "vapp.permitPolicy.get",
      LIST: "vapp.permitPolicy.list",
      UPDATE: "vapp.permitPolicy.update",
      ACTIVATE: "vapp.permitPolicy.activate",
    },
    CAPACITY: {
      GET_RULE: "vapp.capacity.getRule",
      LIST_RULES: "vapp.capacity.listRules",
      SET_RULE: "vapp.capacity.setRule",
      CONSUMPTION: "vapp.capacity.consumption",
      REMAINING: "vapp.capacity.remaining",
    },
    AUDIT: {
      LIST: "vapp.audit.list",
      ENTITY: "vapp.audit.entity",
    },
    PUBLIC_PORTAL: {
      REQUEST_GET: "vapp.publicPortal.requestGet",
      REQUEST_LIST: "vapp.publicPortal.requestList",
      REQUEST_STATUS: "vapp.publicPortal.requestStatus",
      REQUEST_SUBMIT: "vapp.publicPortal.requestSubmit",
      REQUEST_SYNC_TO_ACCESS_REQUEST: "vapp.publicPortal.requestSyncToAccessRequest",
      SETTINGS: "vapp.publicPortal.settings",
    },
    CONFIG: {
      READ: "vapp.config.read",
      PERMIT_TYPE: {
        READ: "vapp.config.permitType.read",
        WRITE: "vapp.config.permitType.write",
      },
      PERMIT_POLICY: {
        READ: "vapp.config.permitPolicy.read",
        WRITE: "vapp.config.permitPolicy.write",
      },
      PERMIT_TYPE_DEPT_ACCESS: {
        READ: "vapp.config.permitTypeDeptAccess.read",
        WRITE: "vapp.config.permitTypeDeptAccess.write",
      },
      SECTOR: {
        READ: "vapp.config.sector.read",
        WRITE: "vapp.config.sector.write",
      },
      FUNCTIONAL_AREA: {
        READ: "vapp.config.functionalArea.read",
        WRITE: "vapp.config.functionalArea.write",
      },
      VEHICLE_TYPE: {
        READ: "vapp.config.vehicleType.read",
        WRITE: "vapp.config.vehicleType.write",
      },
      ACCESS_ZONE: {
        READ: "vapp.config.accessZone.read",
        WRITE: "vapp.config.accessZone.write",
      },
      ACCESS_TYPE: {
        READ: "vapp.config.accessType.read",
        WRITE: "vapp.config.accessType.write",
      },
      VALIDITY: {
        READ: "vapp.config.validity.read",
        WRITE: "vapp.config.validity.write",
      },
      IMPORTANCE: {
        READ: "vapp.config.importance.read",
        WRITE: "vapp.config.importance.write",
      },
    },
    REVIEW: {
      READ: "vapp.review.read",
      APPROVE: "vapp.review.approve",
      REJECT: "vapp.review.reject",
      NEED_INFO: "vapp.review.needinfo",
      PARTIAL_APPROVE: "vapp.review.partialApprove",
      VALIDATE_MATRIX: "vapp.review.validateMatrix",
      CHECK_CAPACITY: "vapp.review.checkCapacity",
      MARK_UNDER_REVIEW: "vapp.review.read",
    },
  },
  ROLE: {
    CREATE: "role.create",
    READ: "role.read",
    UPDATE: "role.update",
    DELETE: "role.delete",
    ASSIGN_PERMISSION: "role.assign_permission",
    REMOVE_PERMISSION: "role.remove_permission",
  },
  PERMISSION: {
    READ: "permission.read",
  },
  STAFF: {
    CREATE: "staff.create",
    READ: "event_staff.read",
    UPDATE: "event_staff.update",
    DELETE: "staff.delete",
    IMPORT: "event_staff.import",
  },
};

export function hasPermission(user, permission) {
  if (!user || user.isActive === false) return false;
  if (isSuperAdmin(user)) return true;
  const list = Array.isArray(user.permissions) ? user.permissions : [];
  return list.includes(permission);
}

export function hasAnyPermission(user, permissions) {
  if (!user || user.isActive === false) return false;
  if (isSuperAdmin(user)) return true;
  const list = Array.isArray(user.permissions) ? user.permissions : [];
  return Array.isArray(permissions) && permissions.some((p) => list.includes(p));
}

export function hasAllPermissions(user, permissions) {
  if (!user || user.isActive === false) return false;
  if (isSuperAdmin(user)) return true;
  const list = Array.isArray(user.permissions) ? user.permissions : [];
  return Array.isArray(permissions) && permissions.every((p) => list.includes(p));
}

export function hasRole(user, roleName) {
  if (!user || user.isActive === false) return false;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  return roles.some((r) => r && (r.name === roleName || r === roleName));
}

export function isSuperAdmin(user) {
  return hasRole(user, "super_admin");
}
