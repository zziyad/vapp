/**
 * Base Transport Class
 * 
 * Abstract base class for all transport implementations.
 * Defines the interface that both HTTP and WebSocket transports must implement.
 */

export class Transport {
  constructor(url) {
    this.url = url;
    this.connected = false;
    this.eventHandlers = new Map();
  }

  /**
   * Make RPC call
   * @param {string} method - Method name (e.g., 'auth/signin')
   * @param {Object} args - Method arguments
   * @returns {Promise<any>} Method result
   */
  async call(method, args) {
    throw new Error('call() must be implemented by subclass');
  }

  /**
   * Connect transport (if needed)
   * @returns {Promise<boolean>} Success status
   */
  async connect() {
    throw new Error('connect() must be implemented by subclass');
  }

  /**
   * Close transport connection
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('close() must be implemented by subclass');
  }

  /**
   * Subscribe to events
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Unsubscribe from events
   * @param {string} event - Event name
   * @param {Function} handler - Event handler to remove
   */
  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to handlers
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
}
