/**
 * Error Handler Utility
 * 
 * Categorizes and handles errors appropriately:
 * - Expected errors: Suppressed or logged in debug mode only
 * - Unexpected errors: Always logged
 */

export class ErrorHandler {
  constructor(options = {}) {
    this.debug = options.debug || false;
  }

  /**
   * Check if error is a connection error (expected during reconnection)
   */
  isConnectionError(error) {
    const message = String(error?.message || '');
    return (
      message.includes('Connection closed') ||
      message.includes('WebSocket not connected') ||
      message.includes('WebSocket not ready') ||
      message.includes('Connection timeout') ||
      error?.code === 'CONNECTION_CLOSED' ||
      error?.code === 'CONNECTION_TIMEOUT'
    );
  }

  /**
   * Check if error is an authentication error
   */
  isAuthError(error) {
    const message = String(error?.message || '');
    return (
      error?.status === 401 ||
      error?.code === 401 ||
      error?.code === 'AUTH_REQUIRED' ||
      error?.code === 'INVALID_TOKEN' ||
      /authentication required|invalid or expired token/i.test(message)
    );
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error) {
    return (
      this.isConnectionError(error) ||
      (error?.retryable === true)
    );
  }

  /**
   * Handle error with appropriate logging
   */
  handleError(error, context = {}) {
    const isConnection = this.isConnectionError(error);
    const isAuth = this.isAuthError(error);
    const isRetryable = this.isRetryable(error);

    // Suppress expected errors (connection errors during reconnection)
    if (isConnection && !this.debug) {
      // Silent - expected during reconnection
      return;
    }

    // Log auth errors (they're important but expected)
    if (isAuth && this.debug) {
      console.debug(`[ErrorHandler] Auth error in ${context.operation || 'operation'}:`, error);
      return;
    }

    // Always log unexpected errors
    if (!isConnection && !isAuth) {
      console.error(
        `[ErrorHandler] Unexpected error in ${context.operation || 'operation'}:`,
        error,
        context
      );
    } else if (this.debug) {
      console.debug(
        `[ErrorHandler] Expected error in ${context.operation || 'operation'}:`,
        error,
        context
      );
    }
  }

  /**
   * Create a retryable error
   */
  createRetryableError(message, code = 'RETRYABLE_ERROR') {
    const error = new Error(message);
    error.code = code;
    error.retryable = true;
    return error;
  }

  /**
   * Create a connection error
   */
  createConnectionError(message = 'Connection closed', code = 'CONNECTION_CLOSED') {
    return this.createRetryableError(message, code);
  }
}
