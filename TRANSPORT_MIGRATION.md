# Transport System Migration Guide

The app now uses a unified transport system supporting both HTTP and WebSocket protocols.

## What Changed?

### Before (Old System)
```jsx
// Direct fetch calls in AuthContext
const response = await fetch(url, options)
const data = await response.json()
```

### After (New System)
```jsx
// Unified client with automatic transport selection
const result = await client.api.auth.signin({ email, password })
```

## Benefits

✅ **Cleaner Code** - No manual fetch/JSON parsing  
✅ **Type-Safe** - Consistent API across all calls  
✅ **WebSocket Support** - Real-time events ready  
✅ **Auto-Fallback** - WS→HTTP on failure  
✅ **Better Errors** - Consistent error handling  
✅ **Future-Proof** - Ready for streaming, events, etc.

## Architecture

```
App
└── TransportProvider (manages client)
    └── AuthProvider (uses client from context)
        └── Your Components (use useAuth)
```

## File Changes

### New Files
- `src/lib/transport/Transport.js` - Base class
- `src/lib/transport/HttpTransport.js` - HTTP implementation
- `src/lib/transport/WebSocketTransport.js` - WebSocket implementation
- `src/lib/transport/Client.js` - Unified client
- `src/contexts/TransportContext.jsx` - React context
- `src/pages/TransportDemo.jsx` - Demo page

### Modified Files
- `src/contexts/AuthContext.jsx` - Now uses transport client
- `src/App.jsx` - Added `TransportProvider`
- `src/routes/routes.config.js` - Added `/transport-demo` route

### Backed Up
- `src/contexts/AuthContext.old.jsx` - Original implementation

## Usage Examples

### 1. In Components (Auth)

```jsx
import { useAuth } from '@/contexts/AuthContext'

function LoginForm() {
  const { login, lastErrorMessage } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) navigate('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      {lastErrorMessage && <p>{lastErrorMessage}</p>}
    </form>
  )
}
```

### 2. Direct Transport Access

```jsx
import { useTransport } from '@/contexts/TransportContext'

function MyComponent() {
  const { client } = useTransport()

  const fetchData = async () => {
    // Automatically selects transport
    const result = await client.api.users.list({})
    console.log(result)
  }

  return <button onClick={fetchData}>Fetch</button>
}
```

### 3. WebSocket Events

```jsx
import { useTransport } from '@/contexts/TransportContext'
import { useEffect, useState } from 'react'

function RealtimeComponent() {
  const { client, wsConnected } = useTransport()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!wsConnected) return

    const handleNotification = (data) => {
      setNotifications(prev => [...prev, data])
    }

    client.on('notification', handleNotification)

    return () => {
      client.off('notification', handleNotification)
    }
  }, [client, wsConnected])

  return (
    <div>
      <div>WebSocket: {wsConnected ? '🟢' : '🔴'}</div>
      {notifications.map((n, i) => (
        <div key={i}>{n.message}</div>
      ))}
    </div>
  )
}
```

## API Call Patterns

### Old Pattern (Removed)
```js
const response = await fetch(`${API_URL}/api`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    type: 'call',
    id: '1',
    method: 'auth/signin',
    args: { email, password }
  })
})
const data = await response.json()
if (data.error) throw new Error(data.error.message)
return data.result
```

### New Pattern
```js
const result = await client.api.auth.signin({ email, password })
// That's it! Errors are thrown automatically
```

## Error Handling

Errors are now consistent across all transports:

```js
try {
  await client.api.auth.signin({ email, password })
} catch (error) {
  console.log(error.message) // "Invalid credentials"
  console.log(error.code)    // "INVALID_CREDENTIALS"
  console.log(error.status)  // 401
}
```

## Testing

Visit **`/transport-demo`** to test:
- HTTP transport
- WebSocket transport
- Unified API calls
- Real-time events

## Backend Requirements

The backend must support the RPC protocol:

```json
// Request
{
  "type": "call",
  "id": "unique-id",
  "method": "namespace/method",
  "args": { /* parameters */ }
}

// Response (success)
{
  "id": "unique-id",
  "result": { /* data */ }
}

// Response (error)
{
  "id": "unique-id",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Environment Variables

```bash
# .env
VITE_API_URL=http://localhost:8005
VITE_WS_URL=ws://localhost:8005/ws
```

## Rollback Instructions

If you need to rollback:

```bash
cd src/contexts
mv AuthContext.jsx AuthContext.v2.jsx
mv AuthContext.old.jsx AuthContext.jsx
```

Then remove `TransportProvider` from `App.jsx`.

## Next Steps

- [ ] Test login/logout flows
- [ ] Test token refresh
- [ ] Test WebSocket connection
- [ ] Implement streaming (future)
- [ ] Add real-time notifications (future)

## Questions?

Check:
- `src/lib/transport/README.md` - Transport docs
- `src/pages/TransportDemo.jsx` - Working examples
- `/transport-demo` - Live testing page
