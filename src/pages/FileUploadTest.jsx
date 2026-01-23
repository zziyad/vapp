/**
 * File Upload Test Page
 * 
 * Test page for streaming file uploads.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FileUploader from '@/components/FileUploader';
import { useAuth } from '@/contexts/AuthContext';
import { useTransport } from '@/contexts/TransportContext';

export default function FileUploadTest() {
  const { user, logout } = useAuth();
  const { wsConnected } = useTransport();
  const navigate = useNavigate();
  const [uploadHistory, setUploadHistory] = useState([]);

  const handleUploadComplete = (result) => {
    setUploadHistory((prev) => [
      {
        ...result.file,
        timestamp: new Date().toLocaleString(),
      },
      ...prev,
    ]);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">File Upload Test</h1>
            <p className="text-muted-foreground mt-2">
              Test WebSocket streaming file uploads
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              ← Dashboard
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

        {/* File Uploader */}
        <FileUploader 
          directory="test-uploads" 
          onUploadComplete={handleUploadComplete}
        />

        {/* Upload History */}
        {uploadHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
              <CardDescription>
                Files uploaded in this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {uploadHistory.map((file, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{file.originalName}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.size.toLocaleString()} bytes • {file.timestamp}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Small File Test (1MB)</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Create a test file: <code className="bg-muted px-1 rounded">dd if=/dev/zero of=test-1mb.bin bs=1M count=1</code></li>
                <li>Upload the file using the uploader above</li>
                <li>Verify progress bar updates smoothly</li>
                <li>Check that upload completes successfully</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Large File Test (50MB+)</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Create a large test file: <code className="bg-muted px-1 rounded">dd if=/dev/zero of=test-50mb.bin bs=1M count=50</code></li>
                <li>Upload the file and monitor progress</li>
                <li>Verify no timeout or connection issues</li>
                <li>Check server logs for stream handling</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Error Handling Test</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Start an upload</li>
                <li>Disconnect WebSocket (close browser tab or disable network)</li>
                <li>Verify error message appears</li>
                <li>Reconnect and try uploading again</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
