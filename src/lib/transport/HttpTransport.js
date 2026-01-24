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
    this.refreshHandler = null;
  }

  /**
   * Make HTTP RPC call
   */
  async call(method, args = {}) {
    const doRequest = async (requestArgs) => {
      const id = this.generateId();
      const packet = {
        type: 'call',
        id,
        method,
        args: requestArgs,
      };

      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.options.headers,
        credentials: this.options.credentials,
        body: JSON.stringify(packet),
      });

      const text = await response.text();
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);
      return { response, data };
    };

    try {
      const { response, data } = await doRequest(args);

      if (!response.ok) {
        if (
          response.status === 401 &&
          this.refreshHandler &&
          !args?._retry &&
          method !== 'auth/refresh'
        ) {
          const refreshed = await this.refreshHandler();
          if (refreshed) {
            const retry = await doRequest({ ...args, _retry: true });
            if (retry.response.ok && !retry.data.error) {
              return retry.data.result;
            }
            const retryError = new Error(
              retry.data.error?.message || `HTTP ${retry.response.status}`,
            );
            retryError.code = retry.data.error?.code || retry.response.status;
            retryError.status = retry.response.status;
            throw retryError;
          }
        }

        const error = new Error(data.error?.message || `HTTP ${response.status}`);
        error.code = data.error?.code || response.status;
        error.status = response.status;
        throw error;
      }

      if (data.error) {
        const error = new Error(data.error.message || 'Request failed');
        error.code = data.error.code;
        throw error;
      }

      return data.result;
    } catch (error) {
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
}
