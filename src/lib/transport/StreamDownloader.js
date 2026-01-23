/**
 * StreamDownloader - Receive binary data streams
 * 
 * Handles receiving files/data over WebSocket in chunks with progress tracking.
 * Compatible with Metacom streaming protocol.
 */

export class StreamDownloader {
  constructor(id, transport, options = {}) {
    this.id = id;
    this.transport = transport;
    
    // Configuration
    this.timeout = options.timeout || 60000; // 60s timeout
    
    // State
    this.name = options.metadata?.name || null;
    this.size = options.size || 0;
    this.received = 0;
    this.chunks = [];
    this.status = 'idle'; // idle, receiving, complete, error
    this.error = null;
    this.metadata = options.metadata || {}; // Store metadata
    
    // Callbacks
    this.onProgress = null;
    this.onData = null; // For streaming (each chunk)
    this.onComplete = null;
    this.onError = null;
    
    // Promise resolvers
    this.resolveReceive = null;
    this.rejectReceive = null;
  }

  /**
   * Get download progress (0-100)
   */
  get progress() {
    if (this.size === 0) return 0;
    return Math.round((this.received / this.size) * 100);
  }

  /**
   * Check if download is complete
   */
  get isComplete() {
    return this.received >= this.size && this.size > 0;
  }

  /**
   * Start receiving stream
   * @returns {Promise<Blob>} Received data as Blob
   */
  async receive() {
    if (this.status === 'receiving') {
      throw new Error('Download already in progress');
    }

    if (this.status === 'complete') {
      return this.toBlob();
    }

    this.status = 'receiving';
    this.error = null;

    return new Promise((resolve, reject) => {
      this.resolveReceive = resolve;
      this.rejectReceive = reject;

      // Setup timeout
      const timeoutId = setTimeout(() => {
        if (this.status === 'receiving') {
          this.handleError(new Error('Download timeout'));
        }
      }, this.timeout);

      // Register with transport
      this.transport.registerStream(this.id, this);

      // Cleanup timeout on complete
      const originalResolve = this.resolveReceive;
      this.resolveReceive = (data) => {
        clearTimeout(timeoutId);
        originalResolve(data);
      };

      const originalReject = this.rejectReceive;
      this.rejectReceive = (error) => {
        clearTimeout(timeoutId);
        originalReject(error);
      };
    });
  }

  /**
   * Handle stream initialization
   * @internal
   */
  handleInit(packet) {
    const { name, size } = packet;
    this.name = name;
    this.size = size;
    this.received = 0;
    this.chunks = [];

    console.log(`[StreamDownloader] Init: ${name} (${size} bytes)`);
  }

  /**
   * Handle incoming chunk (Metacom-style: receives Uint8Array directly)
   * @internal
   */
  handleChunk(uint8Array) {
    if (this.status !== 'receiving') {
      console.warn(`[StreamDownloader] Received chunk but not in receiving state`);
      return;
    }

    // Log first few bytes of first chunk to verify data integrity
    if (this.chunks.length === 0) {
      const preview = Array.from(uint8Array.slice(0, 16))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      console.log(`[StreamDownloader] First chunk preview (hex):`, preview);
    }

    // Store chunk as-is (Uint8Array)
    this.chunks.push(uint8Array);
    this.received += uint8Array.byteLength;

    // Call progress callback
    if (this.onProgress) {
      this.onProgress(this.progress);
    }

    // Call data callback (for streaming mode)
    if (this.onData) {
      this.onData(arrayBuffer);
    }

    // Check if complete
    if (this.isComplete) {
      this.handleComplete();
    }
  }

  /**
   * Handle stream end
   * @internal
   */
  handleEnd() {
    if (this.status === 'receiving' && this.isComplete) {
      // Only complete if we've received all expected bytes
      // Don't trust the 'end' signal alone - it can arrive before binary chunks
      this.handleComplete();
    }
  }

  /**
   * Handle stream completion
   * @private
   */
  handleComplete() {
    this.status = 'complete';

    // Convert chunks to Blob
    const blob = this.toBlob();

    if (this.onComplete) {
      this.onComplete(blob);
    }

    if (this.resolveReceive) {
      this.resolveReceive(blob);
      this.resolveReceive = null;
      this.rejectReceive = null;
    }

    // Unregister from transport
    this.transport.unregisterStream(this.id);
  }

  /**
   * Handle stream error
   * @internal
   */
  handleError(error) {
    this.status = 'error';
    this.error = error;

    console.error(`[StreamDownloader] Error:`, error);

    if (this.onError) {
      this.onError(error);
    }

    if (this.rejectReceive) {
      this.rejectReceive(error);
      this.resolveReceive = null;
      this.rejectReceive = null;
    }

    // Unregister from transport
    this.transport.unregisterStream(this.id);
  }

  /**
   * Handle stream termination
   * @internal
   */
  handleTerminate() {
    this.handleError(new Error('Stream terminated by server'));
  }

  /**
   * Convert received chunks to Blob (Metacom-style: chunks are already Uint8Arrays)
   * @returns {Blob}
   */
  toBlob() {
    if (this.chunks.length === 0) {
      return new Blob([]);
    }

    // Metacom approach: pass chunks directly to Blob
    // chunks are already Uint8Arrays from handleChunk()
    return new Blob(this.chunks, {
      type: (this.metadata && this.metadata.type) || 'application/octet-stream',
    });
  }

  /**
   * Convert received chunks to text
   * @returns {Promise<string>}
   */
  async toText() {
    const blob = this.toBlob();
    return await blob.text();
  }

  /**
   * Convert received chunks to JSON
   * @returns {Promise<any>}
   */
  async toJSON() {
    const text = await this.toText();
    return JSON.parse(text);
  }

  /**
   * Cancel download
   */
  cancel() {
    if (this.status === 'receiving') {
      this.handleError(new Error('Download cancelled by user'));
      
      // Send cancel packet
      const packet = {
        type: 'stream',
        id: this.id,
        status: 'terminate',
      };
      
      this.transport.send(packet).catch(() => {
        // Ignore errors on cancel
      });
    }
  }

  /**
   * Reset downloader to initial state
   */
  reset() {
    this.name = null;
    this.size = 0;
    this.received = 0;
    this.chunks = [];
    this.status = 'idle';
    this.error = null;
    this.resolveReceive = null;
    this.rejectReceive = null;
  }
}
