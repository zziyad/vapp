/**
 * QR Code Utilities (Frontend)
 * 
 * Helper functions for QR payload formatting and parsing
 */

/**
 * Format QR payload following VAPP standard
 * 
 * @param {string} eventId - Event ID
 * @param {string} qrToken - QR token
 * @returns {string} - Formatted payload: "VAPP:<eventId>:<qrToken>"
 */
export function formatQrPayload(eventId, qrToken) {
  return `VAPP:${eventId}:${qrToken}`;
}

/**
 * Parse QR payload string
 * 
 * @param {string} payload - QR payload string
 * @returns {Object|null} - Parsed { prefix, eventId, token } or null if invalid
 */
export function parseQrPayload(payload) {
  if (!payload || typeof payload !== 'string') {
    return null;
  }

  const parts = payload.split(':');
  if (parts.length !== 3 || parts[0] !== 'VAPP') {
    return null;
  }

  return {
    prefix: parts[0],
    eventId: parts[1],
    token: parts[2],
  };
}

/**
 * Extract QR payload from permit meta
 * 
 * @param {Object} permit - Permit object
 * @returns {string|null} - QR payload or null if not available
 */
export function getPermitQrPayload(permit) {
  if (!permit?.meta) {
    return null;
  }

  // Prefer qr_payload if available
  if (permit.meta.qr_payload) {
    return permit.meta.qr_payload;
  }

  // Otherwise construct from eventId and token
  if (permit.event_id && permit.meta.qr_token) {
    return formatQrPayload(permit.event_id, permit.meta.qr_token);
  }

  return null;
}
