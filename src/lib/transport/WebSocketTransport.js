/**
 * WebSocket Transport
 * 
 * WebSocket-based RPC transport with event support.
 * Uses State Machine + ReconnectSupervisor for robust connection management.
 */

import { Transport } from './Transport';
import { createWebSocketStateMachine, WS_STATES } from './WebSocketStateMachine';
import { ReconnectSupervisor } from './ReconnectSupervisor';
import { ErrorHandler } from './ErrorHandler';

export class WebSocketTransport extends Transport {
  constructor(wsUrl, options = {}) {
    super(wsUrl);
    this.ws = null;
    this.callbacks = new Map();
    this.streams = new Map(); // Stream ID → StreamDownloader
    this.connectionPromise = null;
    this.binaryQueue = Promise.resolve();
    this.refreshHandler = null;
    this.reconnectTimeout = null;
    
    // Options
    this.autoReconnect = options.autoReconnect !== false;
    this.debug = options.debug ?? false;
    this.suppressAutoReconnect = false;

    // Initialize State Machine
    this.stateMachine = createWebSocketStateMachine({
      initialState: WS_STATES.IDLE,
      debug: this.debug,
      onTransition: (from, to, context) => {
        if (this.debug) {
          console.debug(`[WS Transport] State: ${from} → ${to}`, context);
        }
        // Emit state change events
        if (to === WS_STATES.CONNECTED) {
          this.emit('connected');
        } else if (to === WS_STATES.DISCONNECTED) {
          this.emit('disconnected');
        }
      },
      handlers: {
        onEnterConnected: () => {
          // Reset supervisor on successful connection
          this.reconnectSupervisor.reset();
        },
        onExitConnected: () => {
          // Clear any reconnect timeout when leaving connected state
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
          }
        },
        onExitDisconnected: () => {
          // Clear reconnect timeout when leaving disconnected state
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
          }
        },
      },
    });

    // Initialize ReconnectSupervisor
    this.reconnectSupervisor = new ReconnectSupervisor({
      minDelay: options.reconnectDelay || 1000,
      maxDelay: options.maxReconnectDelay || 30000,
      maxAttempts: options.maxReconnectAttempts || 10,
      jitter: 0.2, // ±20% randomness
      debug: this.debug,
    });

    // Initialize Error Handler
    this.errorHandler = new ErrorHandler({ debug: this.debug });
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
    if (this.stateMachine.isConnected() && this.ws?.readyState === WebSocket.OPEN) {
      return true;
    }

    // Transition to CONNECTING
    if (!this.stateMachine.transition(WS_STATES.CONNECTING)) {
      // Invalid transition - might already be connecting
      return this.connectionPromise || Promise.resolve(false);
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = 'arraybuffer';

        const timeout = setTimeout(() => {
          if (this.debug) {
            console.warn('[WS Transport] Connection timeout');
          }
          this.ws?.close();
          this.stateMachine.transition(WS_STATES.DISCONNECTED, { reason: 'timeout' });
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.connectionPromise = null;
          this.stateMachine.transition(WS_STATES.CONNECTED);
          resolve(true);
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          this.connectionPromise = null;
          // Suppress expected errors (connection failures are handled by reconnection)
          // Only log in debug mode or if it's a persistent failure
          if (this.debug) {
            console.debug('[WS Transport] Connection error (will retry):', error);
          }
          this.stateMachine.transition(WS_STATES.DISCONNECTED, { reason: 'error' });
          reject(error);
        };

        this.ws.onmessage = (event) => {
          // Suppress verbose message logging in production
          if (this.debug) {
            console.debug(`[WS Transport] Message received:`, {
              type: typeof event.data,
              isString: typeof event.data === 'string',
              size: event.data instanceof Blob 
                ? event.data.size 
                : (event.data.length || event.data.byteLength || 'unknown'),
            });
          }
          
          if (typeof event.data === 'string') {
            this.handleMessage(event.data);
          } else {
            // Binary message: process sequentially to preserve chunk order
            this.binaryQueue = this.binaryQueue
              .then(() => this.handleBinaryMessage(event.data))
              .catch((error) => {
                console.error('[WS Transport] Failed to handle binary message:', error);
              });
          }
        };

        this.ws.onclose = (event) => {
          // Suppress expected close events (page navigation, reconnection)
          const isExpectedClose = 
            event.code === 1000 || // Normal closure
            event.code === 1001 || // Going away
            event.wasClean ||
            this.suppressAutoReconnect; // Manual close
          
          if (!isExpectedClose && this.debug) {
            console.debug('[WS Transport] Connection closed:', {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
            });
          }
          
          // Transition to DISCONNECTED
          this.stateMachine.transition(WS_STATES.DISCONNECTED, {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });
          this.handleDisconnect();
        };
      } catch (error) {
        this.connectionPromise = null;
        this.stateMachine.transition(WS_STATES.DISCONNECTED, { reason: 'exception' });
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Make WebSocket RPC call with retry logic
   */
  async call(method, args = {}, retryCount = 0) {
    const maxRetries = 2;
    
    // Ensure connected - check state machine first
    if (!this.stateMachine.isConnected() || this.ws?.readyState !== WebSocket.OPEN) {
      // Try to reconnect if not already connecting
      if (!this.stateMachine.isConnecting()) {
        try {
          await this.connect();
        } catch (error) {
          // If connection fails and we have retries, wait and retry
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return this.call(method, args, retryCount + 1);
          }
          throw new Error('WebSocket not connected');
        }
      } else {
        // Wait for connection to complete (with timeout)
        try {
          await Promise.race([
            this.connectionPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout')), 10000)
            ),
          ]);
        } catch (error) {
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return this.call(method, args, retryCount + 1);
          }
          throw new Error('WebSocket connection timeout');
        }
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
      // Use error handler to categorize error
      const isConnectionError = this.errorHandler.isConnectionError(error);
      const isAuthError = this.errorHandler.isAuthError(error);
      
      // Retry on connection errors
      if (isConnectionError && retryCount < maxRetries) {
        if (this.debug) {
          console.debug(`[WS Transport] Retrying call due to connection error (attempt ${retryCount + 1}/${maxRetries}):`, method);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.call(method, args, retryCount + 1);
      }
      
      // Handle auth errors
      if (
        isAuthError &&
        this.refreshHandler &&
        !args?._retry &&
        method !== 'auth/refresh'
      ) {
        const refreshed = await this.refreshHandler();
        if (refreshed) {
          await this.forceReconnect();
          return await this.call(method, { ...args, _retry: true }, 0);
        }
      }
      
      // Handle error with appropriate logging
      this.errorHandler.handleError(error, { operation: `call(${method})` });
      
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

      // Unknown packet type - only warn in debug mode
      if (this.debug) {
        console.warn('[WS Transport] Unknown packet type:', packet.type);
      }
    } catch (error) {
      console.error('[WS Transport] Failed to handle WebSocket message:', error);
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
      } else if (this.debug) {
        console.warn(`[WS Transport] Received chunk for unknown stream: ${streamId}`);
      }
    } catch (error) {
      console.error('[WS Transport] Failed to handle binary message:', error);
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
    } else if (this.debug) {
      console.warn('[WS Transport] Unknown stream status:', status);
    }
  }

  /**
   * Send binary chunk (Metacom-style)
   */
  async sendBinary(chunk) {
    if (!this.stateMachine.isConnected() || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    if (this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not ready');
    }

    this.ws.send(chunk);
  }

  /**
   * Send JSON packet
   */
  async send(packet) {
    if (!this.stateMachine.isConnected() || !this.ws) {
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
    this.connectionPromise = null;

    // Reject all pending callbacks with a connection error
    // This allows callers to retry if needed
    this.callbacks.forEach((callback) => {
      const error = this.errorHandler.createConnectionError('Connection closed');
      callback.reject(error);
    });
    this.callbacks.clear();

    // Attempt reconnect if enabled
    if (!this.suppressAutoReconnect && this.autoReconnect) {
      const delay = this.reconnectSupervisor.getNextDelay();
      
      if (delay !== null) {
        // Schedule reconnection (silent - expected behavior)
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectTimeout = null;
          if (this.stateMachine.isDisconnected()) {
            this.connect().catch((error) => {
              // Suppress expected reconnection errors
              // Only log in debug mode or if max attempts reached
              if (this.debug && !this.reconnectSupervisor.canRetry()) {
                console.warn('[WS Transport] Reconnection failed, max attempts reached');
              }
            });
          }
        }, delay);
      } else {
        // Max attempts reached - only log in debug mode
        if (this.debug) {
          console.warn('[WS Transport] Max reconnection attempts reached. Stopping reconnection.');
        }
      }
    }
    
    this.suppressAutoReconnect = false;
  }

  /**
   * Close WebSocket connection
   */
  async close() {
    this.autoReconnect = false; // Disable auto-reconnect
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connectionPromise = null;
    this.stateMachine.transition(WS_STATES.IDLE);
    
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
    this.connectionPromise = null;
    this.stateMachine.transition(WS_STATES.DISCONNECTED, { reason: 'force_reconnect' });
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
    return this.stateMachine.isConnected() && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getState() {
    return this.stateMachine.getState();
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      state: this.stateMachine.getState(),
      stateHistory: this.stateMachine.getHistory(),
      reconnectStats: this.reconnectSupervisor.getStats(),
      callbacks: this.callbacks.size,
      streams: this.streams.size,
      wsReadyState: this.ws?.readyState,
    };
  }
}
