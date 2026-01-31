/**
 * ReconnectSupervisor - Manages WebSocket reconnection strategy
 * 
 * Handles exponential backoff, jitter, and attempt limiting to prevent
 * server overload during outages and thundering herd problems.
 */

export class ReconnectSupervisor {
  #attempt = 0
  #minDelay = 1000
  #maxDelay = 30000
  #maxAttempts = 10
  #jitter = 0.2
  #debug = false

  /**
   * Create a ReconnectSupervisor
   * @param {Object} options
   * @param {number} options.minDelay - Minimum delay in ms (default: 1000)
   * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
   * @param {number} options.maxAttempts - Max reconnection attempts (default: 10)
   * @param {number} options.jitter - Jitter factor 0-1 (default: 0.2 = ±20%)
   * @param {boolean} options.debug - Enable debug logging
   */
  constructor(options = {}) {
    this.#minDelay = options.minDelay ?? 1000
    this.#maxDelay = options.maxDelay ?? 30000
    this.#maxAttempts = options.maxAttempts ?? 10
    this.#jitter = options.jitter ?? 0.2
    this.#debug = options.debug ?? false
  }

  /**
   * Get next reconnection delay with exponential backoff and jitter
   * @returns {number|null} Delay in ms, or null if max attempts reached
   */
  getNextDelay() {
    if (this.#attempt >= this.#maxAttempts) {
      if (this.#debug) {
        console.warn(
          `[ReconnectSupervisor] Max attempts (${this.#maxAttempts}) reached. No more reconnects.`
        )
      }
      return null
    }

    // Exponential backoff: minDelay * (2 ^ attempt)
    // Example with minDelay=1000: 1s, 2s, 4s, 8s, 16s, 32s (capped at maxDelay)
    const exponentialDelay = this.#minDelay * Math.pow(2, this.#attempt)
    const cappedDelay = Math.min(this.#maxDelay, exponentialDelay)

    // Apply jitter to prevent thundering herd
    // If jitter=0.2, delay will be ±20% of base delay
    const jitterAmount = cappedDelay * this.#jitter * (Math.random() - 0.5) * 2
    const finalDelay = Math.round(cappedDelay + jitterAmount)

    // Ensure delay is at least minDelay and at most maxDelay
    const clampedDelay = Math.max(this.#minDelay, Math.min(this.#maxDelay, finalDelay))

    if (this.#debug) {
      console.debug(
        `[ReconnectSupervisor] Attempt ${this.#attempt + 1}/${this.#maxAttempts}: ` +
        `delay=${clampedDelay}ms (base=${cappedDelay}ms, jitter=${Math.round(jitterAmount)}ms)`
      )
    }

    this.#attempt++
    return clampedDelay
  }

  /**
   * Reset attempt counter (call on successful connection)
   */
  reset() {
    const wasAttempting = this.#attempt > 0
    this.#attempt = 0

    if (this.#debug && wasAttempting) {
      console.debug('[ReconnectSupervisor] Reset: connection successful, attempt counter cleared')
    }
  }

  /**
   * Check if reconnection is allowed (not exceeded max attempts)
   * @returns {boolean}
   */
  canRetry() {
    return this.#attempt < this.#maxAttempts
  }

  /**
   * Get current attempt number (0-indexed, before next retry)
   * @returns {number}
   */
  getAttempt() {
    return this.#attempt
  }

  /**
   * Get supervisor statistics
   * @returns {Object}
   */
  getStats() {
    return {
      attempt: this.#attempt,
      maxAttempts: this.#maxAttempts,
      canRetry: this.canRetry(),
      config: {
        minDelay: this.#minDelay,
        maxDelay: this.#maxDelay,
        jitter: this.#jitter,
      },
    }
  }

  /**
   * Force set attempt count (useful for testing or manual control)
   * @param {number} attempt
   */
  setAttempt(attempt) {
    this.#attempt = Math.max(0, Math.min(this.#maxAttempts, attempt))
    if (this.#debug) {
      console.debug(`[ReconnectSupervisor] Attempt manually set to ${this.#attempt}`)
    }
  }

  /**
   * Check if max attempts reached
   * @returns {boolean}
   */
  isMaxed() {
    return this.#attempt >= this.#maxAttempts
  }
}
