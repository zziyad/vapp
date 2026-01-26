/**
 * UUID validation utility
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Check if a string is a valid UUID
 * @param {string} value - Value to check
 * @returns {boolean} - True if valid UUID
 */
export function isValidUUID(value) {
  if (!value || typeof value !== 'string') return false
  return UUID_REGEX.test(value.trim())
}

/**
 * Validate UUID and throw error if invalid
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field (for error message)
 * @throws {Error} - If value is not a valid UUID
 */
export function validateUUID(value, fieldName = 'id') {
  if (!isValidUUID(value)) {
    throw new Error(`${fieldName} must be a valid UUID`)
  }
}
