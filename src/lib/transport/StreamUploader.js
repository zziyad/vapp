/**
 * StreamUploader - File upload with chunking and progress
 * 
 * Handles uploading files/blobs over WebSocket in chunks with progress tracking.
 * Compatible with Metacom streaming protocol.
 */

export class StreamUploader {
  constructor(id, blob, transport, options = {}) {
    this.id = id;
    this.blob = blob;
    this.transport = transport;
    
    // Configuration
    this.chunkSize = options.chunkSize || 64 * 1024; // 64KB default
    this.timeout = options.timeout || 30000; // 30s timeout
    
    // State
    this.uploaded = 0;
    this.status = 'idle'; // idle, uploading, complete, error
    this.error = null;
    
    // Callbacks
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
  }

  /**
   * Get total file size
   */
  get size() {
    return this.blob.size;
  }

  /**
   * Get upload progress (0-100)
   */
  get progress() {
    if (this.size === 0) return 100;
    return Math.round((this.uploaded / this.size) * 100);
  }

  /**
   * Check if upload is complete
   */
  get isComplete() {
    return this.uploaded >= this.size;
  }

  /**
   * Start uploading file
   * @returns {Promise<void>}
   */
  async upload() {
    if (this.status === 'uploading') {
      throw new Error('Upload already in progress');
    }

    if (this.status === 'complete') {
      throw new Error('Upload already completed');
    }

    this.status = 'uploading';
    this.error = null;

    try {
      // Send stream init packet
      await this.sendInitPacket();

      // Upload chunks
      await this.uploadChunks();

      // Send end packet
      await this.sendEndPacket();

      this.status = 'complete';
      this.uploaded = this.size;

      if (this.onComplete) {
        this.onComplete();
      }
    } catch (error) {
      this.status = 'error';
      this.error = error;

      if (this.onError) {
        this.onError(error);
      }

      throw error;
    }
  }

  /**
   * Send stream initialization packet
   * @private
   */
  async sendInitPacket() {
    const packet = {
      type: 'stream',
      id: this.id,
      name: this.blob.name || 'blob',
      size: this.size,
      status: 'init',
    };

    await this.transport.send(packet);
  }

  /**
   * Upload file in chunks
   * @private
   */
  async uploadChunks() {
    const totalChunks = Math.ceil(this.size / this.chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      // Check if cancelled
      if (this.status === 'cancelled') {
        throw new Error('Upload cancelled');
      }

      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, this.size);
      const chunk = this.blob.slice(start, end);

      // Convert to ArrayBuffer
      const arrayBuffer = await this.blobToArrayBuffer(chunk);

      // Send binary chunk with stream ID prefix
      await this.sendChunk(arrayBuffer);

      // Update progress
      this.uploaded = end;
      if (this.onProgress) {
        this.onProgress(this.progress);
      }
    }
  }

  /**
   * Send a single chunk
   * @private
   */
  async sendChunk(arrayBuffer) {
    // Metacom-style chunk encoding: [id_length:1][id:N][payload]
    const encoder = new TextEncoder();
    const idBuffer = encoder.encode(this.id);
    const idLength = idBuffer.length;
    
    if (idLength > 255) {
      throw new Error(`Stream ID length ${idLength} exceeds maximum of 255`);
    }
    
    const payload = new Uint8Array(arrayBuffer);
    const chunk = new Uint8Array(1 + idLength + payload.length);
    chunk[0] = idLength;
    chunk.set(idBuffer, 1);
    chunk.set(payload, 1 + idLength);
    
    await this.transport.sendBinary(chunk);
  }

  /**
   * Send stream end packet
   * @private
   */
  async sendEndPacket() {
    const packet = {
      type: 'stream',
      id: this.id,
      status: 'end',
    };

    await this.transport.send(packet);
  }

  /**
   * Convert Blob to ArrayBuffer
   * @private
   */
  blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * Cancel upload
   */
  cancel() {
    if (this.status === 'uploading') {
      this.status = 'cancelled';
      
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
   * Reset uploader to initial state
   */
  reset() {
    this.uploaded = 0;
    this.status = 'idle';
    this.error = null;
  }
}
