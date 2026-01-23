/**
 * HTTP Transport
 * 
 * HTTP-based RPC transport using fetch API.
 * Suitable for single request-response calls.
 */

import { Transport } from './Transport';

export class HttpTransport extends Transport {
  constructor(apiUrl, options = {}) {
    super(apiUrl);
    this.options = {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
      ...options,
    };
    this.connected = true; // HTTP is always "connected" (stateless)
  }

  /**
   * Make HTTP RPC call
   */
  async call(method, args = {}) {
    const id = this.generateId();
    const packet = {
      type: 'call',
      id,
      method,
      args,
    };

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.options.headers,
        credentials: this.options.credentials,
        body: JSON.stringify(packet),
      });

      // Parse response
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);

      // Handle error responses
      if (!response.ok) {
        const error = new Error(data.error?.message || `HTTP ${response.status}`);
        error.code = data.error?.code || response.status;
        error.status = response.status;
        throw error;
      }

      // Handle application errors
      if (data.error) {
        const error = new Error(data.error.message || 'Request failed');
        error.code = data.error.code;
        throw error;
      }

      return data.result;
    } catch (error) {
      // Re-throw with additional context
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = new Error('Network error: Unable to reach server');
        networkError.code = 'NETWORK_ERROR';
        throw networkError;
      }
      throw error;
    }
  }

  /**
   * HTTP doesn't need explicit connection
   */
  async connect() {
    this.connected = true;
    return true;
  }

  /**
   * HTTP doesn't need explicit close
   */
  async close() {
    this.connected = false;
  }

  /**
   * Generate unique request ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
