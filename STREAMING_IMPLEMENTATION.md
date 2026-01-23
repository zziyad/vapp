# Streaming Implementation 🎉

## Overview
Metacom-style streaming for uploads and downloads over WebSocket.

## Features Implemented

### Frontend
- ✅ **StreamUploader** - Chunked uploads with progress tracking
- ✅ **StreamDownloader** - Binary download receiver
- ✅ **WebSocketTransport** - Binary message handling with ordering
- ✅ **Client API** - `createBlobUploader()` and `createStreamDownloader()`
- ✅ **useFileUpload Hook** - React hook with progress tracking
- ✅ **FileUploader Component** - Drag & drop UI with progress bar
- ✅ **FileManager Page** - Upload, download, history, integrity check

### Backend
- ✅ **Client Stream Management** - Stream creation, tracking, cleanup
- ✅ **WsTransport Binary Handling** - Binary message routing
- ✅ **Stream Handler** - Control packets (init, end, terminate)
- ✅ **files/upload.js API** - File upload via stream pipe
- ✅ **files/download.js API** - File download via stream pipe
- ✅ **files/hash.js API** - SHA-256 integrity check

### Error Handling
- ✅ WebSocket disconnection detection
- ✅ Stream timeout handling
- ✅ File validation and sanitization
- ✅ User-friendly error messages

## Architecture

### Data Flow (Upload)
```
Frontend                    Backend
--------                    -------
File → StreamUploader
  ↓ (init packet)    →    handleStream()
  ↓                        createStream()
  ↓ (binary chunks)  →    handleBinary()
  ↓                        stream.write()
  ↓ (end packet)     →    endStream()
  ↓
API call files/upload  →  Save to disk
  ↓
Result ← ← ← ← ← ← ← ← ← ← Response
```

### Data Flow (Download)
```
Frontend                    Backend
--------                    -------
Create downloader
  ↓ (RPC files/download) → createStream(download)
  ↓                        read file stream
  ↓ (binary chunks)     →  sendStreamChunk()
  ↓
StreamDownloader → Blob → Browser download
```

### Packet Format

**JSON Control Packets:**
```json
{
  "type": "stream",
  "id": "stream-123",
  "status": "init|ready|end|terminate",
  "name": "file.pdf",
  "size": 1048576
}
```

**Binary Chunks:**
```
[id_length:1][id:N][chunk_data]
```

## Usage

### Upload
```javascript
import { useFileUpload } from '@/hooks/useFileUpload';

const { upload, progress, isUploading } = useFileUpload();
await upload(file, { directory: 'documents' });
```

### Download
```javascript
const streamId = `download-${Date.now()}`;
const downloader = client.createStreamDownloader(streamId);
const result = await client.wsTransport.call('files/download', {
  name: fileName,
  directory: 'documents',
  streamId,
});
downloader.size = result.file.size;
const blob = await downloader.receive();
```

### Integrity Check
```javascript
const serverHash = await client.api.files.hash({ name, directory });
const clientHash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
```

## Testing

### Test Page
Navigate to `/file-upload-test` to access:
- Drag & drop upload
- Upload history + download
- Progress tracking
- Integrity check (hash)

## File Structure

```
vapp/src/
├── lib/transport/
│   ├── StreamUploader.js       # File upload with chunking
│   ├── StreamDownloader.js     # Binary data reception
│   ├── WebSocketTransport.js   # Binary message handling
│   └── Client.js               # Stream factory methods
├── hooks/
│   └── useFileUpload.js        # React hook for uploads
├── components/
│   └── FileUploader.jsx        # Drag & drop UI component
└── pages/
    ├── FileUploadTest.jsx      # Test page
    └── FileManager.jsx         # Upload/download manager

main-server/
├── src/
│   ├── server.js               # Stream management in Client class
│   └── transport.js            # Binary message handling
└── application/api/files/
    ├── upload.js               # File upload endpoint
    ├── download.js             # File download endpoint
    └── hash.js                 # File hash endpoint
```

## Configuration

### Chunk Size
Default: 64KB (configurable)

### Timeout
Default: 30s for upload, 60s for download

### Upload Directory
Files saved to: `main-server/uploads/{directory}/`

## Security

- ✅ **Path Traversal Prevention** - Filename sanitization with `path.basename()`
- ✅ **File Validation** - Size and name validation

## Performance

- **Chunking**: 64KB chunks for smooth progress
- **Streaming**: No memory buffering, direct pipe to disk
- **Reconnection**: Auto-reconnect on WebSocket disconnect

## Known Limitations

1. **WebSocket Required** - HTTP fallback not supported for streaming
2. **No Resume** - Upload must restart if interrupted
3. **No Multi-file** - One file at a time (can be extended)

## Future Enhancements

- [ ] Resumable uploads with chunk tracking
- [ ] Multi-file parallel uploads
- [ ] Upload queue management
- [ ] File type validation
- [ ] Virus scanning integration
- [ ] S3/Cloud storage integration

## Troubleshooting

### WebSocket Not Connected
- Check backend is running on correct port
- Verify `VITE_WS_URL` environment variable
- Check browser console for connection errors

### Upload/Download Fails
- Check backend logs for errors
- Verify `uploads/` directory is writable
- Compare hashes via `files/hash`

## Compatibility

- ✅ **Metacom Protocol** - Compatible with Metacom streaming
- ✅ **Node.js Streams** - Uses native Node.js streams
- ✅ **React 18+** - Uses modern React hooks
- ✅ **Modern Browsers** - Requires WebSocket and File API support

## Credits

Implementation based on:
- [Metacom Protocol](../metacom/README.md)
- Node.js Stream API
- WebSocket Binary Frames
- React Hooks Pattern

---

**Status**: ✅ Implemented and tested with integrity checks
**Version**: 1.0.0
**Date**: 2026-01-23
