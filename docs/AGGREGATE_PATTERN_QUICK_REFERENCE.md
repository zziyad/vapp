# Aggregate Pattern - Quick Reference

## 🚀 5-Minute Quick Start

### 1. Import & Setup

```javascript
import { useMemo, useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTransport } from '@/contexts/TransportContext'
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'
```

### 2. Create Aggregate

```javascript
const { client } = useTransport()
const { eventId } = useParams()

const aggregate = useMemo(() => {
  if (!client) return null
  return getEventAggregate(eventId, client) // null for list, eventId for detail
}, [client, eventId])
```

### 3. Subscribe to State

```javascript
const [data, setData] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

useEffect(() => {
  if (!aggregate?.events) return
  return aggregate.events.subscribe((state) => {
    setData(state.detail) // or state.list
    setLoading(state.detailLoading) // or state.listLoading
    setError(state.detailError) // or state.listError
  })
}, [aggregate])
```

### 4. Fetch Data

```javascript
const fetchData = useCallback(async () => {
  if (!aggregate?.events || !eventId) return
  try {
    await aggregate.events.detail(eventId) // or .list(params)
  } catch (err) {
    // Error already in state
  }
}, [aggregate, eventId])

useEffect(() => {
  fetchData()
}, [fetchData])
```

### 5. Render

```javascript
return (
  <div>
    {loading && <div>Loading...</div>}
    {error && <div>{error}</div>}
    {data && <div>{/* Your UI */}</div>}
  </div>
)
```

---

## 📋 Common Operations

### List View

```javascript
// Aggregate (null = list mode)
const aggregate = useMemo(() => {
  if (!client) return null
  return getEventAggregate(null, client)
}, [client])

// Subscribe
useEffect(() => {
  if (!aggregate?.events) return
  return aggregate.events.subscribe((state) => {
    setList(state.list)
    setLoading(state.listLoading)
    setError(state.listError)
  })
}, [aggregate])

// Fetch
const fetchList = useCallback(async () => {
  if (!aggregate?.events) return
  await aggregate.events.list({ page: 1, limit: 10, search: '' })
}, [aggregate])
```

### Detail View

```javascript
// Aggregate (with eventId)
const aggregate = useMemo(() => {
  if (!client) return null
  return getEventAggregate(eventId, client)
}, [client, eventId])

// Subscribe
useEffect(() => {
  if (!aggregate?.events) return
  return aggregate.events.subscribe((state) => {
    setEvent(state.detail)
    setLoading(state.detailLoading)
    setError(state.detailError)
  })
}, [aggregate])

// Fetch
const fetchDetail = useCallback(async () => {
  if (!aggregate?.events || !eventId) return
  await aggregate.events.detail(eventId)
}, [aggregate, eventId])
```

### Create

```javascript
const handleCreate = async (formData) => {
  if (!aggregate?.events) return
  try {
    const created = await aggregate.events.create(formData)
    navigate(`/events/${created.id}`)
  } catch (err) {
    setError(err.message)
  }
}
```

### Update

```javascript
const handleUpdate = async (id, formData) => {
  if (!aggregate?.events) return
  try {
    await aggregate.events.update({ id, data: formData })
    // State updated via subscription
  } catch (err) {
    setError(err.message)
  }
}
```

---

## ⚠️ Common Pitfalls

### ❌ Infinite Loop

```javascript
// BAD - includes state in dependencies
const fetchData = useCallback(async () => {
  await aggregate.events.detail(eventId)
}, [aggregate, eventId, event]) // 'event' causes loop

// GOOD - use ref
const eventRef = useRef(null)
useEffect(() => {
  eventRef.current = event
}, [event])

const fetchData = useCallback(async () => {
  await aggregate.events.detail(eventId)
}, [aggregate, eventId]) // No 'event' here
```

### ❌ Missing Subscription

```javascript
// BAD - no subscription, data won't update
const [event, setEvent] = useState(null)
const fetchData = async () => {
  const data = await aggregate.events.detail(eventId)
  setEvent(data) // Manual update
}

// GOOD - subscribe to state
useEffect(() => {
  if (!aggregate?.events) return
  return aggregate.events.subscribe((state) => {
    setEvent(state.detail) // Automatic update
  })
}, [aggregate])
```

### ❌ Not Checking Aggregate

```javascript
// BAD - will crash if aggregate is null
aggregate.events.detail(eventId)

// GOOD - always check
if (!aggregate?.events) return
await aggregate.events.detail(eventId)
```

---

## 📚 Available Aggregates

### Event Aggregate

```javascript
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'

// List mode
const aggregate = getEventAggregate(null, client)

// Detail mode
const aggregate = getEventAggregate(eventId, client)

// Methods
aggregate.events.list(params)
aggregate.events.detail(id)
aggregate.events.create(payload)
aggregate.events.update({ id, data })
aggregate.events.setDetail(data) // Set manually
aggregate.events.subscribe(listener)
aggregate.events.getState()
```

### State Structure

```javascript
{
  list: { events: [], pagination: null },
  listLoading: false,
  listError: '',
  detail: null,
  detailLoading: false,
  detailError: '',
}
```

---

## 🔗 Related Files

- **Guide**: `docs/AGGREGATE_PATTERN_GUIDE.md` - Complete documentation
- **Template**: `docs/templates/PageWithAggregate.jsx` - Copy-paste template
- **Example**: `pages/EventDetail/index.jsx` - Real implementation
- **Aggregate**: `aggregates/event/` - Aggregate implementation

---

## 💡 Tips

1. **Always use `useMemo`** for aggregate creation
2. **Always subscribe** in `useEffect` with cleanup
3. **Use `useCallback`** for fetch functions
4. **Use refs** to prevent infinite loops
5. **Check aggregate** before using methods
6. **Let aggregate manage** loading/error states

---

## 🆘 Need Help?

See the full guide: `docs/AGGREGATE_PATTERN_GUIDE.md`
