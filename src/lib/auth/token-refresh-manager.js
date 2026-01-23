/**
 * Centralized Token Refresh Manager (SingleFlight Pattern)
 * 
 * Ensures only one token refresh happens at a time across the entire application.
 * All concurrent refresh requests share the same promise.
 */

const DEBUG = typeof window !== 'undefined' && window.location.hostname === 'localhost'

// SingleFlight state
let refreshPromise = null

/**
 * Start or join ongoing token refresh (SingleFlight pattern)
 * @param {Function} refreshFn - The actual refresh function to execute
 * @returns {Promise<boolean>} Promise that resolves to success status
 */
export async function refreshToken(refreshFn) {
  // Return existing promise if refresh is already in progress
  if (refreshPromise) {
    if (DEBUG) console.debug('[REFRESH] Joining existing refresh')
    return refreshPromise
  }

  if (DEBUG) console.debug('[REFRESH] Starting new refresh')

  // Start new refresh
  refreshPromise = (async () => {
    try {
      const success = await refreshFn()
      if (DEBUG) console.debug('[REFRESH] Completed', { success })
      return success
    } catch (error) {
      if (DEBUG) console.error('[REFRESH] Failed', error)
      return false
    } finally {
      // Clear promise after small delay to allow concurrent callers to use result
      setTimeout(() => {
        refreshPromise = null
      }, 100)
    }
  })()

  return refreshPromise
}

/**
 * Check if refresh is currently in progress
 * @returns {boolean}
 */
export function isRefreshing() {
  return refreshPromise !== null
}

/**
 * Clear refresh state (call after logout)
 */
export function clearRefresh() {
  if (DEBUG) console.debug('[REFRESH] Clearing state')
  refreshPromise = null
}

/**
 * Wait for any ongoing refresh to complete
 * @param {number} [timeoutMs=5000] - Maximum time to wait
 * @returns {Promise<boolean>}
 */
export async function waitForRefresh(timeoutMs = 5000) {
  if (!refreshPromise) return true

  try {
    const timeoutPromise = new Promise((resolve) => 
      setTimeout(() => resolve(false), timeoutMs)
    )
    
    const result = await Promise.race([refreshPromise, timeoutPromise])
    return result === true
  } catch {
    return false
  }
}
