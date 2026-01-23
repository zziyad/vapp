/**
 * Token Controller
 * 
 * Centralized token management and cross-tab synchronization.
 * Handles refresh coordination and BroadcastChannel communication.
 */

import { refreshToken, clearRefresh, isRefreshing } from './token-refresh-manager'
import { appConfig } from '@/lib/config'

const DEBUG = appConfig.api.baseUrl.includes('localhost')

// Generation counter to prevent race conditions
let currentGeneration = 0

// BroadcastChannel instance (created on first use)
let broadcastChannel = null

/**
 * Get or create BroadcastChannel instance
 */
function getBroadcastChannel() {
  if (typeof window === 'undefined') return null
  
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel('auth')
    } catch (error) {
      if (DEBUG) console.warn('[TokenController] BroadcastChannel not supported', error)
      return null
    }
  }
  
  return broadcastChannel
}

/**
 * Broadcast message to other tabs
 */
function broadcast(message) {
  const bc = getBroadcastChannel()
  if (!bc) {
    // Fallback to LocalStorage for older browsers
    try {
      localStorage.setItem('auth-event', JSON.stringify({
        ...message,
        timestamp: Date.now()
      }))
      // Clear immediately to trigger storage event
      localStorage.removeItem('auth-event')
    } catch (error) {
      if (DEBUG) console.warn('[TokenController] Broadcast failed', error)
    }
    return
  }
  
  try {
    bc.postMessage(message)
  } catch (error) {
    if (DEBUG) console.warn('[TokenController] BroadcastChannel postMessage failed', error)
  }
}

/**
 * Execute token refresh with SingleFlight pattern
 * @param {Function} performRefreshFn - Function that performs the actual refresh
 * @returns {Promise<boolean>} Success status
 */
export async function executeTokenRefresh(performRefreshFn) {
  if (DEBUG) console.debug('[TokenController] Starting token refresh')
  
  try {
    const success = await refreshToken(performRefreshFn)
    
    if (success) {
      // Increment generation and broadcast to other tabs
      currentGeneration++
      broadcast({
        type: 'token-refreshed',
        generation: currentGeneration
      })
      
      if (DEBUG) console.debug('[TokenController] Token refresh successful', { generation: currentGeneration })
    } else {
      if (DEBUG) console.warn('[TokenController] Token refresh failed')
    }
    
    return success
  } catch (error) {
    if (DEBUG) console.error('[TokenController] Token refresh error', error)
    return false
  }
}

/**
 * Clear token state and broadcast logout to other tabs
 */
export function clearTokenState() {
  if (DEBUG) console.debug('[TokenController] Clearing token state')
  
  clearRefresh()
  
  // Increment generation and broadcast logout
  currentGeneration++
  broadcast({
    type: 'logout',
    generation: currentGeneration
  })
}

/**
 * Setup broadcast listener
 * @param {Object} callbacks - Callback functions
 * @param {Function} callbacks.onTokenRefreshed - Called when token is refreshed in another tab
 * @param {Function} callbacks.onLogout - Called when logout occurs in another tab
 * @returns {Function} Cleanup function
 */
export function setupBroadcastListener({ onTokenRefreshed, onLogout }) {
  const bc = getBroadcastChannel()
  
  // LocalStorage fallback
  const storageHandler = (e) => {
    if (e.key !== 'auth-event' || !e.newValue) return
    
    try {
      const message = JSON.parse(e.newValue)
      handleBroadcastMessage(message)
    } catch (error) {
      if (DEBUG) console.warn('[TokenController] Failed to parse storage event', error)
    }
  }
  
  const handleBroadcastMessage = (message) => {
    if (!message || typeof message !== 'object') return
    
    const { type, generation } = message
    
    // Ignore outdated messages
    if (generation && generation < currentGeneration) {
      if (DEBUG) console.debug('[TokenController] Ignoring outdated message', { type, generation, currentGeneration })
      return
    }
    
    // Update current generation
    if (generation) {
      currentGeneration = Math.max(currentGeneration, generation)
    }
    
    // Handle message
    if (type === 'token-refreshed' && onTokenRefreshed) {
      if (DEBUG) console.debug('[TokenController] Token refreshed in other tab', { generation })
      onTokenRefreshed(message)
    } else if (type === 'logout' && onLogout) {
      if (DEBUG) console.debug('[TokenController] Logout received from other tab', { generation })
      onLogout(message)
    }
  }
  
  // Setup BroadcastChannel listener
  if (bc) {
    bc.onmessage = (e) => handleBroadcastMessage(e.data)
  }
  
  // Setup LocalStorage listener (fallback)
  window.addEventListener('storage', storageHandler)
  
  // Cleanup function
  return () => {
    if (bc) {
      bc.onmessage = null
    }
    window.removeEventListener('storage', storageHandler)
  }
}

/**
 * Close BroadcastChannel (call on unmount)
 */
export function closeBroadcastChannel() {
  if (broadcastChannel) {
    try {
      broadcastChannel.close()
    } catch (error) {
      if (DEBUG) console.warn('[TokenController] Failed to close BroadcastChannel', error)
    }
    broadcastChannel = null
  }
}

/**
 * Check if token refresh is currently in progress
 */
export function isTokenRefreshing() {
  return isRefreshing()
}
