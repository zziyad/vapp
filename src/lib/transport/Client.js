/**
 * Unified Transport Client
 * 
 * Provides a unified interface for both HTTP and WebSocket transports.
 * Automatically selects the appropriate transport and handles fallbacks.
 */

import { HttpTransport } from './HttpTransport';
import { WebSocketTransport } from './WebSocketTransport';
import { StreamUploader } from './StreamUploader';
import { StreamDownloader } from './StreamDownloader';

export class Client {
  constructor(options = {}) {
    // Default URLs (fallback only - TransportContext should always provide URLs)
    // These defaults match production, but are rarely used since TransportContext
    // always passes explicit URLs based on VITE_USE_LOCAL toggle
    const {
      apiUrl = 'https://ts-int.digital/api',
      wsUrl = 'wss://ts-int.digital/ws',
      preferWebSocket = false,
      autoConnectWebSocket = false,
    } = options;

    this.httpTransport = new HttpTransport(apiUrl);
    this.wsTransport = new WebSocketTransport(wsUrl, {
      autoReconnect: options.autoConnectWebSocket !== false,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      reconnectDelay: options.reconnectDelay || 1000,
      maxReconnectDelay: options.maxReconnectDelay || 30000,
      debug: options.debug || false,
    });
    
    this.preferWebSocket = preferWebSocket;
    this.autoConnectWebSocket = autoConnectWebSocket;
    this.authRefreshHandler = null;

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
    const isAuth = typeof method === 'string' && method.startsWith('auth/');

    // Auth always goes over HTTP
    if (isAuth) {
      return await this.httpTransport.call(method, args);
    }

    // All non-auth calls go over WebSocket
    if (!this.wsTransport.isConnected()) {
      try {
        await this.wsTransport.connect();
      } catch (error) {
        throw new Error('WebSocket not connected');
      }
    }

    return await this.wsTransport.call(method, args);
  }

  /**
   * Set token refresh handler for WebSocket calls
   * @param {Function|null} handler
   */
  setAuthRefreshHandler(handler) {
    this.authRefreshHandler = handler || null;
    this.wsTransport.setRefreshHandler(this.authRefreshHandler);
    this.httpTransport.setRefreshHandler(this.authRefreshHandler);
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
      wsState: this.wsTransport.getState?.(),
    };
  }

  /**
   * Get debug information (state machine, reconnect stats, etc.)
   */
  getDebugInfo() {
    return {
      http: {
        connected: this.httpConnected,
      },
      websocket: this.wsTransport.getDebugInfo?.(),
      preferWebSocket: this.preferWebSocket,
    };
  }

  /**
   * Create blob/file uploader for streaming upload
   * @param {Blob|File} blob - File or Blob to upload
   * @param {object} options - Upload options (chunkSize, timeout)
   * @returns {StreamUploader}
   */
  createBlobUploader(blob, options = {}) {
    const id = this.generateStreamId();
    return new StreamUploader(id, blob, this.wsTransport, options);
  }

  /**
   * Create stream downloader for streaming download
   * @param {string} streamId - Stream ID
   * @param {object} options - Download options (timeout)
   * @returns {StreamDownloader}
   */
  createStreamDownloader(streamId, options = {}) {
    return new StreamDownloader(streamId, this.wsTransport, options);
  }

  /**
   * Generate unique stream ID
   * @returns {string}
   */
  generateStreamId() {
    return `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
