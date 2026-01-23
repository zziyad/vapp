# Streaming Quick Start 🚀

## TL;DR
Full WebSocket streaming system for file uploads is ready. Test at `/file-upload-test`.

## Start Testing in 3 Steps

### 1. Start Backend
```bash
cd main-server
npm start
```

### 2. Start Frontend
```bash
cd vapp
npm run dev
```

### 3. Test Upload
1. Login at `http://localhost:5173/login`
2. Navigate to `http://localhost:5173/file-upload-test`
3. Drag & drop a file or click to browse
4. Watch progress bar
5. Check `main-server/uploads/test-uploads/` for uploaded files

## Quick Test Files

```bash
# Small file (1MB)
dd if=/dev/zero of=test-1mb.bin bs=1M count=1

# Large file (50MB)
dd if=/dev/zero of=test-50mb.bin bs=1M count=50
```

## Usage in Your Code

### Option 1: Use the Component (Easiest)
```jsx
import FileUploader from '@/components/FileUploader';

<FileUploader 
  directory="my-uploads"
  onUploadComplete={(result) => console.log(result)}
/>
```

### Option 2: Use the Hook
```jsx
import { useFileUpload } from '@/hooks/useFileUpload';

const { upload, progress, isUploading } = useFileUpload();

const handleUpload = async (file) => {
  const result = await upload(file, { directory: 'documents' });
  console.log('Uploaded:', result.file);
};
```

### Option 3: Direct API
```jsx
import { useTransport } from '@/contexts/TransportContext';

const { client } = useTransport();

const uploader = client.createBlobUploader(file);
uploader.onProgress = (p) => console.log(`${p}%`);
await uploader.upload();

const result = await client.api.files.upload({ 
  streamId: uploader.id 
});
```

## What's Included

✅ **Frontend**
- StreamUploader (chunked uploads)
- StreamDownloader (for future downloads)
- useFileUpload hook
- FileUploader component (drag & drop UI)
- Test page at `/file-upload-test`

✅ **Backend**
- Stream management in Client class
- Binary message handling
- `files/upload` API endpoint
- Automatic file saving to `uploads/`

✅ **Features**
- Progress tracking
- Error handling
- WebSocket auto-reconnect
- File validation
- Authentication required
- Drag & drop UI

## Architecture

```
File → StreamUploader → WebSocket (binary) → Backend Stream → Disk
         ↓ progress
       React Hook
         ↓
       Component
```

## API Response

```json
{
  "success": true,
  "file": {
    "name": "document-1737654321000.pdf",
    "originalName": "document.pdf",
    "size": 1048576,
    "path": "uploads/test-uploads/document-1737654321000.pdf",
    "directory": "test-uploads",
    "uploadedAt": "2026-01-23T12:00:00.000Z",
    "uploadedBy": "user-uuid"
  }
}
```

## Troubleshooting

**WebSocket not connected?**
- Check backend is running
- Verify `VITE_WS_URL` env var
- Check browser console

**Upload fails?**
- Check backend logs
- Verify `uploads/` directory exists
- Ensure user is logged in

**Progress not updating?**
- Verify WebSocket is connected
- Check React DevTools for state updates

## Next Steps

1. Test with small file (1MB)
2. Test with large file (50MB+)
3. Test error handling (disconnect during upload)
4. Integrate into your pages
5. Customize UI as needed

## Full Documentation

See `STREAMING_IMPLEMENTATION.md` for complete details.

---

**Ready to test!** 🎉
