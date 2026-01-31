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
  permitTypeSubtype: {
    list: async (call, eventId, permitTypeId) => {
      return await call('vapp.config.permitTypeSubtype.list', { 
        event_id: eventId, 
        permit_type_id: permitTypeId 
      })
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

/**
 * VAPP Review API methods (Domain C)
 */
export const vappReviewApi = {
  listQueue: async (call, eventId, filters = {}) => {
    return await call('vapp.review.listQueue', {
      event_id: eventId,
      ...filters,
    })
  },

  getBundle: async (call, eventId, requestId) => {
    return await call('vapp.review.getBundle', {
      event_id: eventId,
      request_id: requestId,
    })
  },

  markUnderReview: async (call, eventId, requestId) => {
    return await call('vapp.review.markUnderReview', {
      event_id: eventId,
      request_id: requestId,
    })
  },

  needInfo: async (call, eventId, requestId, message) => {
    return await call('vapp.review.needInfo', {
      event_id: eventId,
      request_id: requestId,
      message,
    })
  },

  approve: async (call, eventId, requestId, reason) => {
    return await call('vapp.review.approve', {
      event_id: eventId,
      request_id: requestId,
      reason,
    })
  },

  reject: async (call, eventId, requestId, reason) => {
    return await call('vapp.review.reject', {
      event_id: eventId,
      request_id: requestId,
      reason,
    })
  },

  partialApprove: async (call, eventId, requestId, data) => {
    return await call('vapp.review.partialApprove', {
      event_id: eventId,
      request_id: requestId,
      ...data,
    })
  },

  validateMatrix: async (call, eventId, requestId) => {
    return await call('vapp.review.validateMatrix', {
      event_id: eventId,
      request_id: requestId,
    })
  },

  bulkApprove: async (call, eventId, requestIds, reason) => {
    return await call('vapp.review.bulkApprove', {
      event_id: eventId,
      request_ids: requestIds,
      reason: reason || null,
    })
  },
};

/**
 * VAPP Permit API methods (Domain D)
 */
export const vappPermitApi = {
  generate: async (call, eventId, requestId, data) => {
    return await call('vapp.permit.generate', {
      event_id: eventId,
      request_id: requestId,
      ...data,
    })
  },
  assignQr: async (call, eventId, permitIds) => {
    return await call('vapp.permit.assignQr', {
      event_id: eventId,
      permit_ids: permitIds,
    });
  },
  list: async (call, filters = {}) => {
    return await call('vapp.permit.list', filters);
  },
  serialPoolListAvailable: async (call, eventId, permitTypeId, subtypeCode = null, options = {}) => {
    return await call('vapp.permit.serialPoolListAvailable', {
      event_id: eventId,
      permit_type_id: permitTypeId,
      subtype_code: subtypeCode,
      limit: options.limit || 200,
      offset: options.offset || 0,
    })
  },
  listForRequester: async (call, eventId, status = null) => {
    return await call('vapp.permit.listForRequester', {
      event_id: eventId,
      ...(status ? { status } : {}),
    });
  },
  acceptTerms: async (call, eventId, permitId) => {
    return await call('vapp.permit.acceptTerms', {
      event_id: eventId,
      permit_id: permitId,
    });
  },
  sendTerms: async (call, eventId, permitIds) => {
    return await call('vapp.permit.sendTerms', {
      event_id: eventId,
      permit_ids: permitIds,
    });
  },
  markTermsAccepted: async (call, eventId, permitIds, data) => {
    return await call('vapp.permit.markTermsAccepted', {
      event_id: eventId,
      permit_ids: permitIds,
      ...data,
    });
  },
};
