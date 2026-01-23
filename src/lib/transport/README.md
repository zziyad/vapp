# Transport System

A dual-transport system that mirrors the backend's HTTP and WebSocket architecture.

## Architecture

```
Transport (base class)
├── HttpTransport (fetch-based)
└── WebSocketTransport (WebSocket-based)
    └── Client (unified interface)
```

## Usage

### 1. Basic Setup (Already Done)

```jsx
// In App.jsx
import { TransportProvider } from '@/contexts/TransportContext'

function App() {
  return (
    <TransportProvider>
      {/* Your app */}
    </TransportProvider>
  )
}
```

### 2. Using in Components

```jsx
import { useTransport } from '@/contexts/TransportContext'

function MyComponent() {
  const { client, wsConnected } = useTransport()

  const fetchData = async () => {
    // Automatically uses HTTP transport
    const result = await client.api.users.list({})
    console.log(result)
  }

  return <button onClick={fetchData}>Fetch</button>
}
```

### 3. Direct Transport Access

```jsx
// Force HTTP
const result = await client.httpTransport.call('auth/me', {})

// Force WebSocket (if connected)
const result = await client.wsTransport.call('auth/me', {})
```

### 4. Real-time Events (WebSocket)

```jsx
useEffect(() => {
  if (!wsConnected) return

  const handler = (data) => {
    console.log('Event received:', data)
  }

  client.on('event-name', handler)

  return () => {
    client.off('event-name', handler)
  }
}, [client, wsConnected])
```

## API Proxy

The client provides a convenient API proxy:

```jsx
// Instead of:
client.call('auth/signin', { email, password })

// You can use:
client.api.auth.signin({ email, password })
```

Pattern: `client.api.{namespace}.{method}(args)`

## Transport Selection

By default, the system uses HTTP transport. WebSocket is used when:
- WebSocket is connected (`wsConnected === true`)
- `preferWebSocket` is enabled
- Method supports real-time (future feature)

## Configuration

```jsx
<TransportProvider>
  {/* Uses environment variables */}
  {/* VITE_API_URL - HTTP endpoint */}
  {/* VITE_WS_URL - WebSocket endpoint */}
</TransportProvider>
```

Or manually:

```js
const client = new Client({
  apiUrl: 'http://localhost:8005/api',
  wsUrl: 'ws://localhost:8005/ws',
  preferWebSocket: false,
  autoConnectWebSocket: true,
})
```

## Error Handling

All transports throw errors consistently:

```js
try {
  await client.api.auth.signin({ email, password })
} catch (error) {
  console.error(error.message) // User-friendly message
  console.error(error.code)    // Error code (if available)
  console.error(error.status)  // HTTP status (if available)
}
```

## Features

✅ **HTTP Transport** - Fetch-based, stateless  
✅ **WebSocket Transport** - Real-time, persistent  
✅ **Auto-fallback** - WS→HTTP on failure  
✅ **Auto-reconnect** - WebSocket reconnection  
✅ **Event system** - Server→Client events  
✅ **API proxy** - Convenient method calls  
✅ **Error handling** - Consistent error format  
✅ **Cross-tab sync** - Via BroadcastChannel  

## Testing

Visit `/transport-demo` to test both transports.

## Comparison with Backend

| Feature | Backend | Frontend |
|---------|---------|----------|
| HTTP | ✅ HttpTransport | ✅ HttpTransport |
| WebSocket | ✅ WsTransport | ✅ WebSocketTransport |
| RPC Protocol | ✅ Same format | ✅ Same format |
| Events | ✅ Server→Client | ✅ Client listens |
| Streaming | 🚧 Planned | 🚧 Planned |
