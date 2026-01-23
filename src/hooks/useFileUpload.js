/**
 * useFileUpload Hook
 * 
 * React hook for file uploads with progress tracking.
 * 
 * Usage:
 *   const { upload, progress, isUploading, error } = useFileUpload();
 *   
 *   const handleUpload = async (file) => {
 *     const result = await upload(file, { directory: 'documents' });
 *     console.log('Uploaded:', result);
 *   };
 */

import { useState, useCallback } from 'react';
import { useTransport } from '@/contexts/TransportContext';

export function useFileUpload() {
  const { client, wsConnected } = useTransport();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  /**
   * Upload file
   * @param {File|Blob} file - File to upload
   * @param {object} options - Upload options
   * @param {string} options.directory - Target directory
   * @param {number} options.chunkSize - Chunk size in bytes
   * @returns {Promise<object>} Upload result
   */
  const upload = useCallback(
    async (file, options = {}) => {
      if (!client) {
        throw new Error('Transport client not initialized');
      }

      if (!wsConnected) {
        throw new Error('WebSocket not connected. File upload requires WebSocket.');
      }

      if (!file) {
        throw new Error('File is required');
      }

      setIsUploading(true);
      setProgress(0);
      setError(null);
      setUploadedFile(null);

      try {
        // Create uploader
        const uploader = client.createBlobUploader(file, {
          chunkSize: options.chunkSize || 64 * 1024, // 64KB default
        });

        // Track progress
        uploader.onProgress = (progressValue) => {
          setProgress(progressValue);
        };

        // Upload file
        await uploader.upload();

        // Complete upload on backend (MUST use WebSocket, not HTTP)
        // The stream only exists on the WebSocket client, not HTTP
        const result = await client.wsTransport.call('files/upload', {
          streamId: uploader.id,
          directory: options.directory || 'general',
        });

        setUploadedFile(result.file);
        setProgress(100);

        return result;
      } catch (err) {
        setError(err.message || 'Upload failed');
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [client, wsConnected]
  );

  /**
   * Reset upload state
   */
  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setError(null);
    setUploadedFile(null);
  }, []);

  return {
    upload,
    progress,
    isUploading,
    error,
    uploadedFile,
    reset,
    wsConnected,
  };
}
