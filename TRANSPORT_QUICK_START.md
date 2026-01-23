# Transport System - Quick Start

## 🚀 Using the Transport Client

### 1. Get the Client

```jsx
import { useTransport } from '@/contexts/TransportContext'

function MyComponent() {
  const { client, wsConnected } = useTransport()
  
  // ...
}
```

### 2. Make API Calls

```jsx
// Pattern: client.api.{namespace}.{method}(args)

// Auth
await client.api.auth.signin({ email, password })
await client.api.auth.logout({})
await client.api.auth.me({})

// Users
await client.api.users.list({ page: 1 })
await client.api.users.get({ id: 123 })
await client.api.users.create({ name: 'John' })

// Any endpoint
await client.api.posts.list({})
await client.api.comments.create({ text: 'Nice!' })
```

### 3. Handle Errors

```jsx
try {
  const user = await client.api.users.get({ id: 123 })
  console.log(user)
} catch (error) {
  console.error(error.message) // User-friendly message
  console.error(error.code)    // ERROR_CODE
}
```

### 4. WebSocket Events

```jsx
useEffect(() => {
  if (!wsConnected) return

  const handler = (data) => {
    console.log('New notification:', data)
  }

  client.on('notification', handler)

  return () => client.off('notification', handler)
}, [client, wsConnected])
```

## 📊 Transport Status

```jsx
const { wsConnected, httpConnected, status } = useTransport()

return (
  <div>
    HTTP: {httpConnected ? '🟢' : '🔴'}
    WS: {wsConnected ? '🟢' : '🔴'}
  </div>
)
```

## 🔧 Direct Transport Access

```jsx
// Force HTTP
const result = await client.httpTransport.call('auth/me', {})

// Force WebSocket
const result = await client.wsTransport.call('auth/me', {})
```

## 🧪 Test It

Visit **`http://localhost:5173/transport-demo`** to test all features.

## 📖 More Info

- `TRANSPORT_MIGRATION.md` - Full migration guide
- `src/lib/transport/README.md` - Transport docs
- `src/pages/TransportDemo.jsx` - Examples

## Common Patterns

### Loading States
```jsx
const [loading, setLoading] = useState(false)

const fetchData = async () => {
  setLoading(true)
  try {
    const data = await client.api.users.list({})
    setData(data)
  } catch (error) {
    setError(error.message)
  } finally {
    setLoading(false)
  }
}
```

### Real-time Updates
```jsx
const [items, setItems] = useState([])

useEffect(() => {
  if (!wsConnected) return

  const handleNew = (item) => {
    setItems(prev => [item, ...prev])
  }

  const handleUpdate = (item) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i))
  }

  client.on('item-created', handleNew)
  client.on('item-updated', handleUpdate)

  return () => {
    client.off('item-created', handleNew)
    client.off('item-updated', handleUpdate)
  }
}, [client, wsConnected])
```

### Optimistic Updates
```jsx
const deleteItem = async (id) => {
  // Optimistic: remove from UI immediately
  setItems(prev => prev.filter(i => i.id !== id))

  try {
    await client.api.items.delete({ id })
  } catch (error) {
    // Rollback on error
    const data = await client.api.items.list({})
    setItems(data)
    alert('Delete failed')
  }
}
```

That's it! You're ready to use the transport system. 🎉
