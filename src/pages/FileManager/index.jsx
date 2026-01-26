/**
 * File Manager Page - Upload, Download, and Manage Files
 * 
 * Test page for Metacom-style streaming file operations
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FileUploader from '@/components/FileUploader';
import { useAuth } from '@/contexts/AuthContext';
import { useTransport } from '@/contexts/TransportContext';

export default function FileManager() {
  const { user, logout } = useAuth();
  const { client, wsConnected } = useTransport();
  const navigate = useNavigate();
  const [uploadHistory, setUploadHistory] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const toHex = (buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  // Fetch file list from backend
  const fetchFileList = async () => {
    if (!client) return;
    
    setIsLoadingFiles(true);
    try {
      const result = await client.api.files.list({ directory: 'test-uploads' });
      if (result && result.files) {
        setUploadHistory(result.files);
      }
    } catch (error) {
      console.error('Failed to fetch file list:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Load file list on mount
  useEffect(() => {
    fetchFileList();
  }, [client]);

  const handleUploadComplete = (result) => {
    // Refresh the file list from backend
    fetchFileList();
  };

  const handleDownload = async (fileName, directory) => {
    if (!wsConnected) {
      alert('WebSocket not connected!');
      return;
    }

    setDownloading(fileName);

    try {
      // CRITICAL: Generate stream ID FIRST, then register downloader BEFORE API call
      // This prevents race condition where binary chunks arrive before downloader exists
      const streamId = `download-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      console.log(`[Download] Pre-registering downloader with ID: ${streamId}`);
      
      // Pre-create downloader with generated ID (size unknown, will be set by init packet)
      const downloader = client.createStreamDownloader(streamId, {
        size: 0, // Will be updated
        metadata: { name: fileName },
      });

      // Track progress
      downloader.onProgress = (progress) => {
        console.log(`Download progress: ${progress}%`);
      };

      // NOW make API call with our pre-generated stream ID
      // Backend will use THIS ID for the stream and START SENDING immediately
      const result = await client.wsTransport.call('files/download', {
        name: fileName,
        directory: directory || 'general',
        streamId, // Pass our ID to backend
      });
      
      console.log('Download API response:', result);
      
      // Update downloader with actual file size
      downloader.size = result.file.size;
      downloader.name = result.file.name;
      
      console.log(`[Download] Downloader size set to: ${result.file.size}`);

      // Receive file (binary chunks are already arriving in parallel)
      const blob = await downloader.receive();

      console.log('Download complete:', blob.size, 'bytes');

      // Verify integrity by comparing SHA-256 with backend
      const [serverHash, clientDigest] = await Promise.all([
        client.api.files.hash({ name: fileName, directory: directory || 'general' }),
        blob.arrayBuffer().then((buf) => crypto.subtle.digest('SHA-256', buf)),
      ]);
      const clientHash = toHex(clientDigest);

      if (serverHash.hash !== clientHash) {
        alert(`Hash mismatch! Server=${serverHash.hash} Client=${clientHash}`);
        return;
      }

      // Trigger browser download
      // NOTE: Do NOT revoke immediately—some browsers can corrupt the file
      // if the object URL is revoked before the download finishes.
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 30000);

      alert(`Downloaded: ${fileName}`);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">File Manager</h1>
            <p className="text-muted-foreground mt-2">
              Upload, download, and manage files with Metacom streaming
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/events')}>
              ← Events
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">
                WebSocket: {wsConnected ? 'Connected ✓' : 'Disconnected ✗'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="font-medium">
                User: {user?.email || 'Not logged in'}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Upload Files</h2>
            <FileUploader 
              directory="test-uploads" 
              onUploadComplete={handleUploadComplete}
            />
          </div>

          {/* Upload History */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Upload History</h2>
            {uploadHistory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No files uploaded yet
                </CardContent>
              </Card>
            ) : isLoadingFiles ? (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Uploads</CardTitle>
                  <CardDescription>Loading files...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Recent Uploads</CardTitle>
                      <CardDescription>
                        {uploadHistory.length} file(s) in directory
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchFileList}
                      disabled={isLoadingFiles}
                    >
                      🔄 Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {uploadHistory.map((file, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.size.toLocaleString()} bytes • {new Date(file.uploadedAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Type: {file.type}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(file.name, file.directory)}
                          disabled={downloading === file.name || !wsConnected}
                        >
                          {downloading === file.name ? '⏳ Downloading...' : '⬇️ Download'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Testing Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Guide</CardTitle>
            <CardDescription>
              Test Metacom-style streaming upload and download
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">📤 Upload Test</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Create test file: <code className="bg-muted px-2 py-1 rounded">dd if=/dev/zero of=test-1mb.bin bs=1M count=1</code></li>
                <li>Drag & drop to upload area above</li>
                <li>Watch progress bar and console logs</li>
                <li>Verify file appears in upload history</li>
                <li>Check backend: <code className="bg-muted px-2 py-1 rounded">ls main-server/uploads/test-uploads/</code></li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">📥 Download Test</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Upload a file first (see above)</li>
                <li>Click "Download" button in upload history</li>
                <li>Watch console logs for stream progress</li>
                <li>File should download to your browser</li>
                <li>Verify downloaded file matches original</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🔧 Backend API</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-muted p-3 rounded">
                  <p className="font-mono text-xs">
                    <span className="text-green-600">POST</span> /api → files/upload
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Payload: <code>{`{ streamId, directory }`}</code>
                  </p>
                </div>
                <div className="bg-muted p-3 rounded">
                  <p className="font-mono text-xs">
                    <span className="text-blue-600">POST</span> /api → files/download
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Payload: <code>{`{ name, directory }`}</code>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">📊 Browser Console</h3>
              <p className="text-sm text-muted-foreground">
                Open browser console (F12) to see detailed stream logs:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4 mt-2">
                <li>Upload progress: Chunk-by-chunk streaming</li>
                <li>Download progress: Real-time percentage</li>
                <li>WebSocket connection events</li>
                <li>Stream initialization and completion</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Pattern Info */}
        <Card>
          <CardHeader>
            <CardTitle>Metacom Pattern</CardTitle>
            <CardDescription>
              Simple pipe-based streaming (no manual error handling)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold mb-2">Backend Upload (Metacom-style):</p>
                <pre className="bg-muted p-3 rounded overflow-x-auto">
{`const readable = context.client.getStream(streamId);
const writable = node.fs.createWriteStream(filePath);
readable.pipe(writable);
return { result: 'Stream initialized' };`}
                </pre>
              </div>

              <div>
                <p className="font-semibold mb-2">Backend Download (Metacom-style):</p>
                <pre className="bg-muted p-3 rounded overflow-x-auto">
{`const readable = node.fs.createReadStream(filePath);
const writable = context.client.createStream(name, size);
readable.pipe(writable);
return { streamId: writable.streamId };`}
                </pre>
              </div>

              <div className="pt-4 border-t">
                <p className="font-semibold">✅ Benefits:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                  <li>Matches official Metacom examples</li>
                  <li>Simple, clean code</li>
                  <li>Non-blocking, returns immediately</li>
                  <li>Automatic error handling by streams</li>
                  <li>Compatible with all Metacom clients</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
