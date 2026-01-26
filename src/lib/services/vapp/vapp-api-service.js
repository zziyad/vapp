"use client";

/**
 * VAPP API Service (vapp)
 * Uses WebSocket transport for VAPP operations.
 */

export const vappDashboardApi = {
  stats: async (call, eventId) => {
    return await call("vapp.dashboard.stats", { event_id: eventId });
  },
};

export const vappConfigApi = {
  readiness: async (call, eventId) => {
    return await call("vapp.config.readiness", { event_id: eventId });
  },
  permitType: {
    list: async (call, eventId, filters = {}) => {
      return await call('vapp.config.permitType.list', { event_id: eventId, ...filters })
    },
    get: async (call, eventId, permitTypeId) => {
      return await call('vapp.config.permitType.get', { event_id: eventId, permit_type_id: permitTypeId })
    },
    create: async (call, eventId, data) => {
      return await call('vapp.config.permitType.create', { event_id: eventId, ...data })
    },
    update: async (call, eventId, permitTypeId, data) => {
      return await call('vapp.config.permitType.update', { event_id: eventId, permit_type_id: permitTypeId, ...data })
    },
    toggleActive: async (call, eventId, permitTypeId) => {
      return await call('vapp.config.permitType.toggleActive', { event_id: eventId, permit_type_id: permitTypeId })
    },
  },
};
