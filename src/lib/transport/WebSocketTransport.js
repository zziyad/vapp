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
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.autoReconnect = options.autoReconnect !== false;
    this.connectionPromise = null;
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
          this.handleMessage(event.data);
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

    return new Promise((resolve, reject) => {
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

      // Handle stream data (for future streaming support)
      if (packet.type === 'stream-data') {
        this.emit('stream-data', packet);
        return;
      }

      // Unknown packet type
      console.warn('Unknown packet type:', packet.type);
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error);
    }
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
      if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        // Silent reconnection attempts - backend might not have WS support yet
        setTimeout(() => {
          this.connect().catch(() => {
            // Silent failure - this is expected if backend doesn't support WS
          });
        }, delay);
      }
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
