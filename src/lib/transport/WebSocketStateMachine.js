/**
 * WebSocket State Machine - Simplified 4-state version
 * 
 * Manages connection lifecycle with explicit states and validated transitions.
 * States: IDLE → CONNECTING → CONNECTED → DISCONNECTED
 */

export const WS_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
}

/**
 * Valid state transitions
 */
const TRANSITIONS = {
  [WS_STATES.IDLE]: [WS_STATES.CONNECTING],
  [WS_STATES.CONNECTING]: [WS_STATES.CONNECTED, WS_STATES.DISCONNECTED],
  [WS_STATES.CONNECTED]: [WS_STATES.DISCONNECTED],
  [WS_STATES.DISCONNECTED]: [WS_STATES.CONNECTING, WS_STATES.IDLE],
}

/**
 * Create a WebSocket State Machine
 * @param {Object} options
 * @param {string} options.initialState - Initial state
 * @param {Function} options.onTransition - Callback on state change: (from, to, context) => void
 * @param {Object} options.handlers - State enter/exit handlers
 * @param {boolean} options.debug - Enable debug logging
 * @returns {Object} State machine API
 */
export function createWebSocketStateMachine(options = {}) {
  const {
    initialState = WS_STATES.IDLE,
    onTransition = () => {},
    handlers = {},
    debug = false,
  } = options

  let currentState = initialState
  const transitionHistory = []

  /**
   * Check if transition is valid
   */
  function canTransition(from, to) {
    const allowed = TRANSITIONS[from] || []
    return allowed.includes(to)
  }

  /**
   * Perform state transition
   * @param {string} nextState - Target state
   * @param {Object} context - Additional context for handlers
   * @returns {boolean} Success
   */
  function transition(nextState, context = {}) {
    if (currentState === nextState) {
      if (debug) console.debug(`[WS State] Already in ${nextState}`)
      return true
    }

    if (!canTransition(currentState, nextState)) {
      if (debug) {
        console.warn(
          `[WS State] Invalid transition: ${currentState} -> ${nextState}`,
          { allowed: TRANSITIONS[currentState] }
        )
      }
      return false
    }

    const previousState = currentState

    // Call exit handler for previous state
    const exitHandler = handlers[`onExit${capitalize(previousState)}`]
    if (exitHandler) {
      try {
        exitHandler(context)
      } catch (error) {
        console.error(`[WS State] Exit handler error for ${previousState}:`, error)
      }
    }

    // Update state
    currentState = nextState
    transitionHistory.push({
      from: previousState,
      to: nextState,
      timestamp: Date.now(),
      context,
    })

    // Keep last 50 transitions
    if (transitionHistory.length > 50) {
      transitionHistory.shift()
    }

    if (debug) {
      console.debug(`[WS State] ${previousState} -> ${nextState}`, context)
    }

    // Call transition callback
    try {
      onTransition(previousState, nextState, context)
    } catch (error) {
      console.error('[WS State] onTransition error:', error)
    }

    // Call enter handler for new state
    const enterHandler = handlers[`onEnter${capitalize(nextState)}`]
    if (enterHandler) {
      try {
        enterHandler(context)
      } catch (error) {
        console.error(`[WS State] Enter handler error for ${nextState}:`, error)
      }
    }

    return true
  }

  /**
   * Get current state
   */
  function getState() {
    return currentState
  }

  /**
   * Check if in a specific state
   */
  function is(state) {
    return currentState === state
  }

  /**
   * Check if connected
   */
  function isConnected() {
    return currentState === WS_STATES.CONNECTED
  }

  /**
   * Check if connecting
   */
  function isConnecting() {
    return currentState === WS_STATES.CONNECTING
  }

  /**
   * Check if disconnected or idle
   */
  function isDisconnected() {
    return currentState === WS_STATES.DISCONNECTED || currentState === WS_STATES.IDLE
  }

  /**
   * Get transition history
   */
  function getHistory() {
    return [...transitionHistory]
  }

  /**
   * Reset to initial state
   */
  function reset() {
    const previousState = currentState
    currentState = initialState
    transitionHistory.length = 0
    if (debug) {
      console.debug(`[WS State] Reset: ${previousState} -> ${initialState}`)
    }
  }

  return {
    transition,
    getState,
    is,
    isConnected,
    isConnecting,
    isDisconnected,
    getHistory,
    reset,
    // Constants for convenience
    STATES: WS_STATES,
  }
}

/**
 * Helper: Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
