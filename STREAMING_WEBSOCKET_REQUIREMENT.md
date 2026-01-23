# WebSocket Requirement for Streaming

## Critical Constraint

**All RPC calls related to streaming MUST use the same WebSocket connection that sent/received the stream.**

## Why?

In the Metacom protocol, streams are stored at the **client instance level** on the backend. Each WebSocket connection has its own `Client` instance, while HTTP requests create temporary client instances.

### The Problem

```javascript
// ❌ WRONG - This will fail
const uploader = client.createBlobUploader(file);
await uploader.upload(); // Sends via WebSocket (Client A)
const result = await client.api.files.upload({ streamId: uploader.id }); // HTTP request (Client B)
// Error: Stream not found (Client B doesn't have streams from Client A)
```

### The Solution

```javascript
// ✅ CORRECT - Use WebSocket for the RPC call
const uploader = client.createBlobUploader(file);
await uploader.upload(); // Sends via WebSocket (Client A)
const result = await client.wsTransport.call('files/upload', { streamId: uploader.id }); // WebSocket (Client A)
// Success: Both use the same client instance
```

## Implementation Details

### Frontend

**`useFileUpload.js`**:
- Always uses `client.wsTransport.call()` for `files/upload` RPC call
- Ensures WebSocket is connected before uploading

### Backend

**`files/upload.js`**:
- Accesses stream via `context.client.getStream(streamId)`
- `context.client` is the WebSocket client that received the stream

## Transport Configuration

In `TransportContext.jsx`:

```javascript
const transportClient = new Client({
  apiUrl,
  wsUrl,
  preferWebSocket: false, // HTTP is preferred for regular API calls
  autoConnectWebSocket: true, // But WebSocket auto-connects for streaming
});
```

- `preferWebSocket: false` - Most API calls use HTTP for simplicity
- But streaming operations explicitly use `wsTransport.call()` to use WebSocket

## Testing

Always test streaming with:
1. WebSocket connected
2. Upload initiated
3. Verify the RPC call goes through WebSocket (check Network tab)
4. Confirm stream is found on backend

## Future Considerations

If you need to support HTTP-based streaming, you would need to:
1. Store streams at the server level (shared map across all clients)
2. Implement stream expiration/cleanup
3. Handle race conditions and security (ensure only the correct user can access their streams)

For now, **WebSocket-only streaming is the recommended approach**.
