/**
 * FileUploader Component
 * 
 * Drag-and-drop file uploader with progress tracking.
 * Uses WebSocket streaming for efficient uploads.
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFileUpload } from '@/hooks/useFileUpload';

export default function FileUploader({ directory = 'general', onUploadComplete }) {
  const { upload, progress, isUploading, error, uploadedFile, reset, wsConnected } = useFileUpload();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      reset();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      reset();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await upload(selectedFile, { directory });
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (err) {
      // Error is already set in hook
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Upload</CardTitle>
        <CardDescription>
          {wsConnected 
            ? 'Upload files using WebSocket streaming' 
            : '⚠️ WebSocket not connected. File upload unavailable.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-primary/50'
          } ${!wsConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => wsConnected && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            disabled={!wsConnected}
          />
          
          <div className="space-y-2">
            <div className="text-4xl">📁</div>
            <p className="text-lg font-medium">
              {isDragging ? 'Drop file here' : 'Drag & drop file here'}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse
            </p>
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {!isUploading && !uploadedFile && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  ✕
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success Message */}
            {uploadedFile && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md">
                <p className="font-medium">✓ Upload successful!</p>
                <p className="text-sm mt-1">
                  Saved as: {uploadedFile.name}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md">
                <p className="font-medium">✗ Upload failed</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || !wsConnected || !!uploadedFile}
            className="flex-1"
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>

          {(uploadedFile || error) && (
            <Button variant="outline" onClick={handleReset}>
              Upload Another
            </Button>
          )}
        </div>

        {/* WebSocket Status */}
        {!wsConnected && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-sm">
            <p className="font-medium">⚠️ WebSocket Disconnected</p>
            <p className="mt-1">
              File upload requires an active WebSocket connection. Please wait for reconnection...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
