# Metacom Streaming Pattern 🔄

## Overview
Implementation follows the **official Metacom streaming pattern** with simple `pipe()` for maximum compatibility.

## Backend Pattern (Metacom-style)

### Upload (Client → Server)
```javascript
// application/api/files/upload.js
({
  access: 'private',
  method: async ({ streamId, directory = 'general' }) => {
    // Get incoming stream from client
    const readable = context.client.getStream(streamId);
    const { name, size } = readable.metadata;

    // Prepare file path
    const sanitizedName = node.path.basename(name);
    const filePath = node.path.join(process.cwd(), 'uploads', directory, sanitizedName);

    // Create writable stream and pipe
    const writable = node.fs.createWriteStream(filePath);
    readable.pipe(writable);

    // Return immediately (async completion)
    return { result: 'Stream initialized', file: { name, size } };
  },
});
```

### Download (Server → Client)
```javascript
// application/api/files/download.js
({
  access: 'private',
  method: async ({ name, directory = 'general' }) => {
    // Prepare file path
    const filePath = node.path.join(process.cwd(), 'uploads', directory, name);
    
    // Get file size
    const { size } = await node.fsp.stat(filePath);

    // Create readable stream from file
    const readable = node.fs.createReadStream(filePath);

    // Create Metacom writable stream to client
    const writable = context.client.createStream(name, size);

    // Pipe file to client
    readable.pipe(writable);

    // Return stream info
    return { streamId: writable.streamId, file: { name, size } };
  },
});
```

## Frontend Pattern

### Upload Flow
```javascript
// 1. Create uploader
const uploader = client.createBlobUploader(file);

// 2. Track progress
uploader.onProgress = (progress) => {
  console.log(`Upload: ${progress}%`);
};

// 3. Upload file (sends binary chunks)
await uploader.upload();

// 4. Complete on backend
const result = await client.api.files.upload({
  streamId: uploader.id,
  directory: 'documents',
});

console.log('Uploaded:', result.file);
```

### Download Flow
```javascript
// 1. Request download (backend starts streaming)
const result = await client.api.files.download({
  name: 'document.pdf',
  directory: 'documents',
});

// 2. Create downloader
const downloader = client.createStreamDownloader(result.streamId);

// 3. Track progress
downloader.onProgress = (progress) => {
  console.log(`Download: ${progress}%`);
};

// 4. Receive file
const blob = await downloader.receive();

// 5. Use blob (download, display, etc.)
const url = URL.createObjectURL(blob);
// ... use url ...
```

## Key Differences from Complex Pattern

### Simple Metacom Pattern ✅ (Current)
```javascript
// Just pipe - Metacom handles everything
const writable = node.fs.createWriteStream(filePath);
readable.pipe(writable);
return { result: 'Stream initialized' };
```

**Pros:**
- ✅ Matches official Metacom examples
- ✅ Simpler code
- ✅ Returns immediately
- ✅ Stream completes asynchronously

**Cons:**
- ⚠️ Less error visibility in response
- ⚠️ No immediate completion confirmation

### Complex Pattern (Alternative)
```javascript
// Manual error handling and completion
const writable = node.fs.createWriteStream(filePath);
try {
  await pipeline(readable, writable);
  return { success: true, file: { ... } };
} catch (error) {
  await fs.unlink(filePath); // cleanup
  throw error;
}
```

**Pros:**
- ✅ Explicit error handling
- ✅ Completion confirmation
- ✅ Automatic cleanup on failure

**Cons:**
- ⚠️ More complex
- ⚠️ Blocks until complete
- ⚠️ Requires manual error management

## Why Metacom Pattern?

1. **Consistency** - Matches official Metacom examples
2. **Simplicity** - Less boilerplate code
3. **Performance** - Non-blocking, returns immediately
4. **Compatibility** - Works with all Metacom clients

## Error Handling

### Stream Errors (Automatic)
```javascript
// Metacom handles stream errors automatically:
// - Connection lost → stream terminates
// - Client cancels → stream closes
// - Server error → error packet sent
```

### Business Logic Errors (Manual)
```javascript
// Validate before creating stream
if (!name) {
  throw new Error('File name required');
}

// Check file exists (for download)
try {
  await node.fsp.access(filePath);
} catch {
  throw new Error('File not found');
}
```

## Protocol Flow

### Upload
```
Client                          Server
------                          ------
createBlobUploader(file)
  ↓ (init packet)          →    handleStream('init')
  ↓                              createStream(id)
  ↓ (binary chunks)        →    handleBinary()
  ↓                              stream.write()
  ↓ (end packet)           →    handleStream('end')
  ↓
api.files.upload({ streamId }) → getStream(id)
  ↓                              pipe to file
  ↓                         ←    { result: 'initialized' }
✅ Complete
```

### Download
```
Client                          Server
------                          ------
api.files.download({ name })  → fs.createReadStream()
  ↓                              createStream(name, size)
  ↓                              readable.pipe(writable)
  ↓                         ←    { streamId }
createStreamDownloader(id)
  ↓                         ←    (init packet)
  ↓                         ←    (binary chunks)
  ↓                         ←    (end packet)
receive()
  ↓
✅ Blob ready
```

## File Structure

```
main-server/application/api/files/
├── upload.js          # Upload with Metacom pipe
└── download.js        # Download with Metacom pipe

vapp/src/lib/transport/
├── StreamUploader.js   # Client-side upload
└── StreamDownloader.js # Client-side download
```

## Testing

### Test Upload
```bash
# Create test file
dd if=/dev/zero of=test.bin bs=1M count=10

# Upload via test page
# → http://localhost:5173/file-upload-test

# Verify
ls -lh main-server/uploads/test-uploads/
```

### Test Download
```javascript
// In browser console
const { client } = window.__TRANSPORT__;

const result = await client.api.files.download({ 
  name: 'test-1234.bin',
  directory: 'test-uploads' 
});

const downloader = client.createStreamDownloader(result.streamId);
const blob = await downloader.receive();
console.log('Downloaded:', blob.size, 'bytes');
```

## Summary

✅ **Simple, clean, Metacom-compatible**
- Just `pipe()` - no manual error handling
- Returns immediately - async completion
- Matches official Metacom examples
- Works with all Metacom features

---

**Pattern Source**: [Metacom Protocol Documentation](../metacom/README.md)
