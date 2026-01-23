/**
 * Unified Transport Client
 * 
 * Provides a unified interface for both HTTP and WebSocket transports.
 * Automatically selects the appropriate transport and handles fallbacks.
 */

import { HttpTransport } from './HttpTransport';
import { WebSocketTransport } from './WebSocketTransport';

export class Client {
  constructor(options = {}) {
    const {
      apiUrl = 'http://localhost:8005/api',
      wsUrl = 'ws://localhost:8005/ws',
      preferWebSocket = false,
      autoConnectWebSocket = false,
    } = options;

    this.httpTransport = new HttpTransport(apiUrl);
    this.wsTransport = new WebSocketTransport(wsUrl, {
      autoReconnect: true,
      maxReconnectAttempts: 5,
    });
    
    this.preferWebSocket = preferWebSocket;
    this.autoConnectWebSocket = autoConnectWebSocket;

    // Forward WebSocket events
    this.wsTransport.on('connected', () => {
      this.emit('ws:connected');
    });

    this.wsTransport.on('disconnected', () => {
      this.emit('ws:disconnected');
    });

    // Auto-connect WebSocket if enabled
    if (this.autoConnectWebSocket) {
      this.connectWebSocket().catch(() => {
        // Ignore connection errors on auto-connect
      });
    }

    // Create API proxy for convenient method calls
    this.api = this.createApiProxy();
  }

  /**
   * Create API proxy for convenient method calls
   * Usage: client.api.auth.signin({ email, password })
   */
  createApiProxy() {
    return new Proxy({}, {
      get: (target, namespace) => {
        return new Proxy({}, {
          get: (target, method) => {
            return async (args) => {
              return this.call(`${namespace}/${method}`, args);
            };
          },
        });
      },
    });
  }

  /**
   * Connect to WebSocket server
   */
  async connectWebSocket() {
    try {
      await this.wsTransport.connect();
      return true;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      return false;
    }
  }

  /**
   * Make RPC call using appropriate transport
   */
  async call(method, args = {}) {
    // Try WebSocket if connected and preferred
    if (this.preferWebSocket && this.wsTransport.isConnected()) {
      try {
        return await this.wsTransport.call(method, args);
      } catch (error) {
        console.warn('WebSocket call failed, falling back to HTTP:', error);
        // Fallback to HTTP below
      }
    }

    // Use HTTP transport
    return await this.httpTransport.call(method, args);
  }

  /**
   * Subscribe to server events (WebSocket only)
   */
  on(event, handler) {
    // Forward to WebSocket transport
    this.wsTransport.on(event, handler);
  }

  /**
   * Unsubscribe from server events
   */
  off(event, handler) {
    this.wsTransport.off(event, handler);
  }

  /**
   * Emit local events
   */
  emit(event, data) {
    this.wsTransport.emit(event, data);
  }

  /**
   * Check if WebSocket is connected
   */
  get wsConnected() {
    return this.wsTransport.isConnected();
  }

  /**
   * Check if HTTP transport is available
   */
  get httpConnected() {
    return this.httpTransport.connected;
  }

  /**
   * Get current transport status
   */
  getStatus() {
    return {
      http: this.httpConnected,
      websocket: this.wsConnected,
      preferWebSocket: this.preferWebSocket,
    };
  }

  /**
   * Close all transports
   */
  async close() {
    await Promise.all([
      this.httpTransport.close(),
      this.wsTransport.close(),
    ]);
  }
}
