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

export const vappAccessRequestApi = {
  list: async (call, filters = {}) => {
    return await call('vapp.request.list', filters)
  },
  
  listMy: async (call, eventId, filters = {}) => {
    return await call('vapp.request.list', {
      event_id: eventId,
      ...filters,
    })
  },
  
  get: async (call, eventId, requestId) => {
    return await call('vapp.request.get', { 
      event_id: eventId,
      request_id: requestId 
    })
  },
  
  create: async (call, data) => {
    return await call('vapp.request.create', data)
  },
  
  update: async (call, requestId, data) => {
    return await call('vapp.request.update', { id: requestId, ...data })
  },
  
  cancel: async (call, eventId, requestId, reason) => {
    return await call('vapp.request.cancel', { 
      event_id: eventId,
      request_id: requestId,
      reason 
    })
  },
  
  deleteDraft: async (call, eventId, requestId) => {
    return await call('vapp.request.deleteDraft', {
      event_id: eventId,
      request_id: requestId,
    })
  },
  
  updateHeader: async (call, eventId, requestId, data) => {
    return await call('vapp.request.update', {
      event_id: eventId,
      request_id: requestId,
      justification: data.justification,
      notes: data.notes,
      ...(data.source_ref ? { source_ref: data.source_ref } : {}),
    })
  },
  
  submit: async (call, eventId, requestId) => {
    return await call('vapp.request.submit', { 
      event_id: eventId,
      request_id: requestId 
    })
  },
  
  item: {
    list: async (call, eventId, requestId, options = {}) => {
      return await call('vapp.request.item.list', { 
        event_id: eventId,
        request_id: requestId,
        id: requestId,
        ...(options || {}),
      })
    },
  },
};
