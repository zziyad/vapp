# Aggregate Pattern - Default Data Fetching

## ⚡ Quick Start

The **Aggregate Pattern** is the **default and required** way to fetch data in pages.

### 📖 Documentation

- **[Complete Guide](./docs/AGGREGATE_PATTERN_GUIDE.md)** - Full documentation with examples
- **[Quick Reference](./docs/AGGREGATE_PATTERN_QUICK_REFERENCE.md)** - 5-minute cheat sheet
- **[Template](./docs/templates/PageWithAggregate.jsx)** - Copy-paste template

### 🎯 When to Use

**✅ ALWAYS use aggregates for:**
- Event Detail pages (`/events/:eventId`)
- VAPP pages (Admin, Ops, Requester)
- Any page that fetches data from the backend

**❌ Don't use aggregates for:**
- Static pages (no data fetching)
- Simple forms (no complex state)

### 📝 Basic Example

```javascript
import { useMemo, useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTransport } from '@/contexts/TransportContext'
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'

export default function MyPage() {
  const { client } = useTransport()
  const { eventId } = useParams()
  
  // 1. Create aggregate
  const aggregate = useMemo(() => {
    if (!client) return null
    return getEventAggregate(eventId, client)
  }, [client, eventId])
  
  // 2. Local state
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 3. Subscribe to aggregate state
  useEffect(() => {
    if (!aggregate?.events) return
    return aggregate.events.subscribe((state) => {
      setEvent(state.detail)
      setLoading(state.detailLoading)
      setError(state.detailError)
    })
  }, [aggregate])
  
  // 4. Fetch data
  const fetchData = useCallback(async () => {
    if (!aggregate?.events || !eventId) return
    await aggregate.events.detail(eventId)
  }, [aggregate, eventId])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  // 5. Render
  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      {event && <div>{event.name}</div>}
    </div>
  )
}
```

### 🚀 Next Steps

1. Read the [Quick Reference](./docs/AGGREGATE_PATTERN_QUICK_REFERENCE.md)
2. Copy the [Template](./docs/templates/PageWithAggregate.jsx)
3. See [EventDetail](./src/pages/EventDetail/index.jsx) for a real example

---

## 📚 Available Aggregates

### Event Aggregate

```javascript
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'

// List mode
const aggregate = getEventAggregate(null, client)
await aggregate.events.list({ page: 1, limit: 10 })

// Detail mode
const aggregate = getEventAggregate(eventId, client)
await aggregate.events.detail(eventId)
```

**Methods:**
- `list(params)` - Get list of events
- `detail(id)` - Get single event
- `create(payload)` - Create event
- `update({ id, data })` - Update event
- `setDetail(data)` - Set detail manually
- `subscribe(listener)` - Subscribe to state changes
- `getState()` - Get current state

---

## ⚠️ Important Rules

1. **Always use `useMemo`** for aggregate creation
2. **Always subscribe** in `useEffect` with cleanup
3. **Use `useCallback`** for fetch functions
4. **Don't include state** in fetch dependencies (use refs)
5. **Check aggregate** before using methods

---

## 🔗 Links

- [Complete Guide](./docs/AGGREGATE_PATTERN_GUIDE.md)
- [Quick Reference](./docs/AGGREGATE_PATTERN_QUICK_REFERENCE.md)
- [Template](./docs/templates/PageWithAggregate.jsx)
- [Example: EventDetail](./src/pages/EventDetail/index.jsx)
- [Example: Events List](./src/pages/Events/index.jsx)
