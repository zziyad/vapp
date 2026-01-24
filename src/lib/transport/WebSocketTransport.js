/**
 * WebSocket Transport
 * 
 * WebSocket-based RPC transport with event support.
 * Suitable for real-time communication and streaming.
 */

import { Transport } from './Transport';

export class WebSocketTransport extends Transport {
  constructor(wsUrl, options = {}) {
    super(wsUrl);
    this.ws = null;
    this.callbacks = new Map();
    this.streams = new Map(); // Stream ID → StreamDownloader
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.autoReconnect = options.autoReconnect !== false;
    this.connectionPromise = null;
    this.binaryQueue = Promise.resolve();
    this.refreshHandler = null;
    this.suppressAutoReconnect = false;
  }

  /**
   * Connect to WebSocket server
   */
  async connect() {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Already connected
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      return true;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        // Ensure binary frames arrive as ArrayBuffer to preserve ordering
        this.ws.binaryType = 'arraybuffer';

        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
          this.ws?.close();
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.connected = true;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          this.emit('connected');
          resolve(true);
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          this.connectionPromise = null;
          reject(error);
        };

        this.ws.onmessage = (event) => {
          console.log(`[WS onmessage] Received:`, {
            type: typeof event.data,
            isString: typeof event.data === 'string',
            size: event.data instanceof Blob ? event.data.size : (event.data.length || event.data.byteLength || 'unknown'),
          });
          
          if (typeof event.data === 'string') {
            this.handleMessage(event.data);
          } else {
            // Binary message: process sequentially to preserve chunk order
            this.binaryQueue = this.binaryQueue
              .then(() => this.handleBinaryMessage(event.data))
              .catch((error) => {
                console.error('Failed to handle binary message:', error);
              });
          }
        };

        this.ws.onclose = () => {
          this.handleDisconnect();
        };
      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Make WebSocket RPC call
   */
  async call(method, args = {}) {
    // Ensure connected
    if (!this.connected || this.ws?.readyState !== WebSocket.OPEN) {
      // Try to reconnect
      try {
        await this.connect();
      } catch (error) {
        throw new Error('WebSocket not connected');
      }
    }

    const id = this.generateId();
    const packet = {
      type: 'call',
      id,
      method,
      args,
    };

    const doCall = () => new Promise((resolve, reject) => {
      // Store callback
      this.callbacks.set(id, { resolve, reject, method });

      // Send packet
      try {
        this.ws.send(JSON.stringify(packet));
      } catch (error) {
        this.callbacks.delete(id);
        reject(error);
        return;
      }

      // Timeout after 30s
      setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);
    });

    try {
      return await doCall();
    } catch (error) {
      const message = String(error?.message || '');
      const authError =
        error?.status === 401 ||
        error?.code === 401 ||
        error?.code === 'AUTH_REQUIRED' ||
        error?.code === 'INVALID_TOKEN' ||
        /authentication required|invalid or expired token/i.test(message);

      if (
        authError &&
        this.refreshHandler &&
        !args?._retry &&
        method !== 'auth/refresh'
      ) {
        const refreshed = await this.refreshHandler();
        if (refreshed) {
          await this.forceReconnect();
          return await this.call(method, { ...args, _retry: true });
        }
      }
      throw error;
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(data) {
    try {
      const packet = JSON.parse(data);

      // Handle RPC callback response
      if (packet.type === 'callback') {
        const callback = this.callbacks.get(packet.id);
        if (callback) {
          this.callbacks.delete(packet.id);
          
          if (packet.error) {
            const error = new Error(packet.error.message || 'Request failed');
            error.code = packet.error.code;
            error.status = packet.error.status;
            callback.reject(error);
          } else {
            callback.resolve(packet.result);
          }
        }
        return;
      }

      // Handle server-sent events
      if (packet.type === 'event' && packet.name) {
        this.emit(packet.name, packet.data);
        return;
      }

      // Handle stream control packets
      if (packet.type === 'stream') {
        this.handleStreamPacket(packet);
        return;
      }

      // Unknown packet type
      console.warn('Unknown packet type:', packet.type);
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error);
    }
  }

  /**
   * Handle binary WebSocket message (stream chunks)
   */
  async handleBinaryMessage(data) {
    try {
      // Metacom-style chunk decoding: [id_length:1][id:N][payload]
      const arrayBuffer = data instanceof ArrayBuffer 
        ? data 
        : await data.arrayBuffer();

      const chunk = new Uint8Array(arrayBuffer);
      const idLength = chunk[0];
      const streamId = new TextDecoder().decode(chunk.subarray(1, 1 + idLength));
      
      // CRITICAL: Create immediate copy using .slice() which returns a NEW Uint8Array with NEW buffer
      // Browser reuses WebSocket buffer for next message, so views become invalid
      const payload = chunk.slice(1 + idLength);
      
      const stream = this.streams.get(streamId);
      if (stream) {
        stream.handleChunk(payload);
      } else {
        console.warn(`Received chunk for unknown stream: ${streamId}`);
      }
    } catch (error) {
      console.error('Failed to handle binary message:', error);
    }
  }

  /**
   * Handle stream control packets
   */
  handleStreamPacket(packet) {
    const { id, status, name, size } = packet;
    const stream = this.streams.get(id);

    if (status === 'init' && name && typeof size === 'number') {
      // Server initiated stream (download)
      if (stream) {
        stream.handleInit(packet);
      }
    } else if (status === 'ready') {
      // Stream ready to receive data
      // This is typically for uploads - no action needed
    } else if (status === 'end') {
      // Stream completed
      if (stream) {
        stream.handleEnd();
      }
    } else if (status === 'terminate') {
      // Stream terminated
      if (stream) {
        stream.handleTerminate();
      }
    } else {
      console.warn('Unknown stream status:', status);
    }
  }

  /**
   * Send binary chunk (Metacom-style)
   */
  async sendBinary(chunk) {
    if (!this.connected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    if (this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not ready');
    }

    this.ws.send(chunk);
  }

  /**
   * Send JSON packet (overridden to add stream support)
   */
  async send(packet) {
    if (!this.connected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    if (this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not ready');
    }

    this.ws.send(JSON.stringify(packet));
  }

  /**
   * Register stream for receiving data
   */
  registerStream(streamId, stream) {
    this.streams.set(streamId, stream);
  }

  /**
   * Unregister stream
   */
  unregisterStream(streamId) {
    this.streams.delete(streamId);
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnect() {
    this.connected = false;
    this.connectionPromise = null;

    // Reject all pending callbacks
    this.callbacks.forEach((callback, id) => {
      callback.reject(new Error('Connection closed'));
    });
    this.callbacks.clear();

    // Emit disconnect event
    this.emit('disconnected');

      // Attempt reconnect if enabled
      if (!this.suppressAutoReconnect && this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        // Silent reconnection attempts - backend might not have WS support yet
        setTimeout(() => {
          this.connect().catch(() => {
            // Silent failure - this is expected if backend doesn't support WS
          });
        }, delay);
      }
      this.suppressAutoReconnect = false;
  }

  /**
   * Close WebSocket connection
   */
  async close() {
    this.autoReconnect = false; // Disable auto-reconnect
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connected = false;
    this.connectionPromise = null;
    
    // Clear all callbacks
    this.callbacks.forEach((callback) => {
      callback.reject(new Error('Connection closed by client'));
    });
    this.callbacks.clear();
  }

  /**
   * Force reconnect without disabling auto-reconnect
   */
  async forceReconnect() {
    if (this.ws) {
      this.suppressAutoReconnect = true;
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.connectionPromise = null;
    return this.connect();
  }

  /**
   * Set token refresh handler (called on 401)
   */
  setRefreshHandler(handler) {
    this.refreshHandler = handler || null;
  }

  /**
   * Generate unique request ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }
}
