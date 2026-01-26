# Aggregate Pattern - Complete Guide

## Overview

The **Aggregate Pattern** is the **default and recommended** way to fetch and manage data in pages. It provides:
- ✅ Built-in state management (loading, error, data)
- ✅ Automatic caching and reuse
- ✅ Reactive subscriptions for real-time updates
- ✅ Consistent error handling
- ✅ Separation of concerns (business logic in aggregates, UI in components)

## Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Pattern](#basic-pattern)
3. [Advanced Patterns](#advanced-patterns)
4. [Creating New Aggregates](#creating-new-aggregates)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Step 1: Get the Aggregate

```javascript
import { useTransport } from '@/contexts/TransportContext'
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'

export default function MyPage() {
  const { client } = useTransport()
  const { eventId } = useParams() // or get from props/state
  
  // Create aggregate (cached, reusable)
  const aggregate = useMemo(() => {
    if (!client) return null
    return getEventAggregate(eventId, client)
  }, [client, eventId])
}
```

### Step 2: Subscribe to State Changes

```javascript
const [data, setData] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

useEffect(() => {
  if (!aggregate?.events) return
  
  // Subscribe to state changes
  return aggregate.events.subscribe((state) => {
    setData(state.detail) // or state.list, etc.
    setLoading(state.detailLoading) // or state.listLoading
    setError(state.detailError) // or state.listError
  })
}, [aggregate])
```

### Step 3: Trigger Data Fetch

```javascript
const fetchData = useCallback(async () => {
  if (!aggregate?.events || !eventId) return
  try {
    await aggregate.events.detail(eventId) // or .list(), .create(), etc.
  } catch (err) {
    // Error is already set in state via subscription
    console.error('Fetch failed:', err)
  }
}, [aggregate, eventId])

useEffect(() => {
  fetchData()
}, [fetchData])
```

### Step 4: Use in UI

```javascript
return (
  <div>
    {loading && <div>Loading...</div>}
    {error && <div className="text-red-600">{error}</div>}
    {data && <div>{/* Render data */}</div>}
    <button onClick={fetchData} disabled={loading}>
      Refresh
    </button>
  </div>
)
```

---

## Basic Pattern

### Pattern Structure

```javascript
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTransport } from '@/contexts/TransportContext'
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'

export default function MyPage() {
  // 1. Get dependencies
  const { client } = useTransport()
  const { eventId } = useParams()
  
  // 2. Create aggregate
  const aggregate = useMemo(() => {
    if (!client) return null
    return getEventAggregate(eventId, client)
  }, [client, eventId])
  
  // 3. Local state for UI
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 4. Subscribe to aggregate state
  useEffect(() => {
    if (!aggregate?.events) return
    return aggregate.events.subscribe((state) => {
      setData(state.detail)
      setLoading(state.detailLoading)
      setError(state.detailError)
    })
  }, [aggregate])
  
  // 5. Fetch function
  const fetchData = useCallback(async () => {
    if (!aggregate?.events || !eventId) return
    try {
      await aggregate.events.detail(eventId)
    } catch (err) {
      // Error handled by subscription
    }
  }, [aggregate, eventId])
  
  // 6. Trigger fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  // 7. Render UI
  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      {data && <div>{/* Your UI */}</div>}
    </div>
  )
}
```

---

## Advanced Patterns

### Pattern 1: List with Filters

```javascript
export default function EventsList() {
  const { client } = useTransport()
  const aggregate = useMemo(() => {
    if (!client) return null
    return getEventAggregate(null, client) // null = list mode
  }, [client])
  
  const [listState, setListState] = useState({
    list: { events: [], pagination: null },
    listLoading: false,
    listError: '',
  })
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
  })
  
  // Subscribe
  useEffect(() => {
    if (!aggregate?.events) return
    return aggregate.events.subscribe((state) => {
      setListState({
        list: state.list,
        listLoading: state.listLoading,
        listError: state.listError,
      })
    })
  }, [aggregate])
  
  // Fetch with filters
  const fetchEvents = useCallback(async () => {
    if (!aggregate?.events) return
    await aggregate.events.list(filters)
  }, [aggregate, filters])
  
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])
  
  return (
    <div>
      {/* Filters */}
      <input
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
      />
      
      {/* List */}
      {listState.listLoading && <div>Loading...</div>}
      {listState.list.events.map((event) => (
        <div key={event.id}>{event.name}</div>
      ))}
    </div>
  )
}
```

### Pattern 2: Create/Update Operations

```javascript
export default function EventForm() {
  const { client } = useTransport()
  const { eventId } = useParams()
  const aggregate = useMemo(() => {
    if (!client) return null
    return getEventAggregate(eventId, client)
  }, [client, eventId])
  
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!aggregate?.events) return
    
    setIsSaving(true)
    try {
      if (eventId) {
        // Update
        await aggregate.events.update({ id: eventId, data: formData })
      } else {
        // Create
        await aggregate.events.create(formData)
      }
      // Success - navigate or show message
    } catch (err) {
      // Error handled
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

### Pattern 3: Optimistic Updates

```javascript
export default function EventDetail() {
  const { client } = useTransport()
  const { eventId } = useParams()
  const aggregate = useMemo(() => {
    if (!client) return null
    return getEventAggregate(eventId, client)
  }, [client, eventId])
  
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!aggregate?.events) return
    return aggregate.events.subscribe((state) => {
      setEvent(state.detail)
      setLoading(state.detailLoading)
    })
  }, [aggregate])
  
  // Optimistic update
  const handleQuickUpdate = async (field, value) => {
    if (!aggregate?.events || !event) return
    
    // Update UI immediately
    setEvent({ ...event, [field]: value })
    
    try {
      // Update backend
      await aggregate.events.update({
        id: eventId,
        data: { [field]: value },
      })
    } catch (err) {
      // Revert on error
      setEvent(event) // Restore original
      alert('Update failed')
    }
  }
  
  return (
    <div>
      <input
        value={event?.name || ''}
        onChange={(e) => handleQuickUpdate('name', e.target.value)}
      />
    </div>
  )
}
```

### Pattern 4: Preventing Infinite Loops

```javascript
export default function EventDetail() {
  const { client } = useTransport()
  const { eventId } = useParams()
  const location = useLocation()
  
  const aggregate = useMemo(() => {
    if (!client) return null
    return getEventAggregate(eventId, client)
  }, [client, eventId])
  
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const eventRef = useRef(null) // Use ref to prevent loops
  
  useEffect(() => {
    eventRef.current = event
  }, [event])
  
  useEffect(() => {
    if (!aggregate?.events) return
    return aggregate.events.subscribe((state) => {
      setLoading(state.detailLoading)
      setError(state.detailError)
      if (state.detail) {
        setEvent(state.detail)
      }
    })
  }, [aggregate])
  
  const fetchEvent = useCallback(async () => {
    if (!aggregate?.events || !eventId) return
    try {
      await aggregate.events.detail(eventId)
    } catch (err) {
      // Only set error if we don't have data and no location state
      if (!eventRef.current && !location?.state?.event) {
        setError(err?.message || 'Failed to load event')
      }
    }
  }, [aggregate, eventId, location?.state?.event]) // Don't include 'event' in deps
  
  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])
  
  return <div>{/* UI */}</div>
}
```

---

## Creating New Aggregates

### Step 1: Create Module

Create `aggregates/my-domain/modules/create-my-module.js`:

```javascript
import { createModuleBehavior } from './create-module-behavior'

export function createMyModule(client, eventBus) {
  let state = {
    items: [],
    loading: false,
    error: '',
  }
  
  const behavior = createModuleBehavior(eventBus, {
    name: 'myModule',
    initial: { ...state },
  })
  
  const setState = (partial) => {
    state = { ...state, ...partial }
    behavior.setState({ data: state })
  }
  
  const unwrap = (result, fallbackMessage) => {
    if (!result) throw new Error(fallbackMessage)
    if (result.status === 'fulfilled') return result.response
    if (result.status === 'rejected') {
      throw new Error(result.response || fallbackMessage)
    }
    return result
  }
  
  const list = async (params) => {
    if (!client) throw new Error('Transport client not ready')
    setState({ loading: true, error: '' })
    try {
      const result = await client.api.myDomain.list(params || {})
      const data = unwrap(result, 'Failed to load items')
      setState({ items: data?.items || [] })
      if (eventBus) eventBus.emit('myModule:list:loaded', data)
      return data
    } catch (error) {
      setState({ error: error.message || 'Failed to load items' })
      throw error
    } finally {
      setState({ loading: false })
    }
  }
  
  const get = async (id) => {
    if (!client) throw new Error('Transport client not ready')
    if (!id) throw new Error('ID is required')
    setState({ loading: true, error: '' })
    try {
      const result = await client.api.myDomain.get({ id })
      const data = unwrap(result, 'Item not found')
      setState({ item: data })
      if (eventBus) eventBus.emit('myModule:item:loaded', data)
      return data
    } catch (error) {
      setState({ error: error.message || 'Item not found' })
      throw error
    } finally {
      setState({ loading: false })
    }
  }
  
  const subscribe = (listener) => behavior.subscribe(listener)
  const getState = () => state
  
  return {
    list,
    get,
    subscribe,
    getState,
  }
}
```

### Step 2: Create Aggregate

Create `aggregates/my-domain/create-my-aggregate.js`:

```javascript
import { createMyModule } from './modules/create-my-module'
import { createEventBus } from '@/lib/aggregates/event-bus'

export function createMyAggregate(id, client, options = {}) {
  const eventBus = createEventBus()
  const myModule = createMyModule(client, eventBus)
  
  return {
    id,
    myModule,
    eventBus,
  }
}
```

### Step 3: Create Getter with Caching

Create `aggregates/my-domain/get-my-aggregate.js`:

```javascript
import { createMyAggregate } from './create-my-aggregate'

const cache = new Map()
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export function getMyAggregate(id, client, options = {}) {
  const key = id || 'list'
  const cached = cache.get(key)
  
  if (cached && cached.client === client) {
    cached.lastAccess = Date.now()
    return cached.aggregate
  }
  
  const aggregate = createMyAggregate(id, client, options)
  cache.set(key, {
    aggregate,
    client,
    createdAt: Date.now(),
    lastAccess: Date.now(),
    ttl: options.ttl || DEFAULT_TTL,
  })
  
  return aggregate
}
```

### Step 4: Use in Component

```javascript
import { getMyAggregate } from '@/aggregates/my-domain/get-my-aggregate'

export default function MyPage() {
  const { client } = useTransport()
  const { id } = useParams()
  
  const aggregate = useMemo(() => {
    if (!client) return null
    return getMyAggregate(id, client)
  }, [client, id])
  
  // ... rest of pattern
}
```

---

## Best Practices

### ✅ DO

1. **Always use `useMemo` for aggregate creation**
   ```javascript
   const aggregate = useMemo(() => {
     if (!client) return null
     return getEventAggregate(eventId, client)
   }, [client, eventId])
   ```

2. **Subscribe in `useEffect` with cleanup**
   ```javascript
   useEffect(() => {
     if (!aggregate?.module) return
     return aggregate.module.subscribe((state) => {
       // Update local state
     })
   }, [aggregate])
   ```

3. **Use `useCallback` for fetch functions**
   ```javascript
   const fetchData = useCallback(async () => {
     if (!aggregate?.module) return
     await aggregate.module.list()
   }, [aggregate])
   ```

4. **Handle errors gracefully**
   ```javascript
   try {
     await aggregate.events.detail(eventId)
   } catch (err) {
     // Error already in state via subscription
     console.error('Fetch failed:', err)
   }
   ```

5. **Use refs to prevent infinite loops**
   ```javascript
   const dataRef = useRef(null)
   useEffect(() => {
     dataRef.current = data
   }, [data])
   ```

### ❌ DON'T

1. **Don't create aggregate in render**
   ```javascript
   // ❌ BAD
   const aggregate = getEventAggregate(eventId, client)
   
   // ✅ GOOD
   const aggregate = useMemo(() => {
     if (!client) return null
     return getEventAggregate(eventId, client)
   }, [client, eventId])
   ```

2. **Don't forget to cleanup subscriptions**
   ```javascript
   // ❌ BAD
   useEffect(() => {
     aggregate?.module.subscribe((state) => {
       setData(state.data)
     })
   }, [aggregate])
   
   // ✅ GOOD
   useEffect(() => {
     if (!aggregate?.module) return
     return aggregate.module.subscribe((state) => {
       setData(state.data)
     })
   }, [aggregate])
   ```

3. **Don't include state in fetch dependencies**
   ```javascript
   // ❌ BAD - causes infinite loop
   const fetchData = useCallback(async () => {
     await aggregate.events.detail(eventId)
   }, [aggregate, eventId, event]) // 'event' causes loop
   
   // ✅ GOOD
   const fetchData = useCallback(async () => {
     await aggregate.events.detail(eventId)
   }, [aggregate, eventId])
   ```

4. **Don't manually manage loading/error if using aggregate**
   ```javascript
   // ❌ BAD
   const [loading, setLoading] = useState(false)
   const fetchData = async () => {
     setLoading(true)
     try {
       await aggregate.events.list()
     } finally {
       setLoading(false)
     }
   }
   
   // ✅ GOOD - aggregate manages state
   useEffect(() => {
     if (!aggregate?.events) return
     return aggregate.events.subscribe((state) => {
       setLoading(state.listLoading) // From aggregate
     })
   }, [aggregate])
   ```

---

## Common Patterns

### Pattern: List with Pagination

```javascript
const [page, setPage] = useState(1)
const limit = 10

const fetchEvents = useCallback(async () => {
  if (!aggregate?.events) return
  await aggregate.events.list({ page, limit })
}, [aggregate, page, limit])
```

### Pattern: Search with Debounce

```javascript
const [search, setSearch] = useState('')
const [debouncedSearch, setDebouncedSearch] = useState('')

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search)
  }, 300)
  return () => clearTimeout(timer)
}, [search])

const fetchEvents = useCallback(async () => {
  if (!aggregate?.events) return
  await aggregate.events.list({ search: debouncedSearch })
}, [aggregate, debouncedSearch])
```

### Pattern: Loading Initial Data from Location State

```javascript
useEffect(() => {
  if (location?.state?.event) {
    setEvent(location.state.event)
    if (aggregate?.events) {
      aggregate.events.setDetail(location.state.event)
    }
  }
}, [location?.state?.event, aggregate])
```

---

## Troubleshooting

### Problem: Infinite Loop

**Cause:** State in fetch dependencies

**Solution:**
```javascript
// Use ref instead
const dataRef = useRef(null)
useEffect(() => {
  dataRef.current = data
}, [data])

const fetchData = useCallback(async () => {
  // Use ref.current instead of data
}, [aggregate]) // Don't include data
```

### Problem: Data Not Updating

**Cause:** Missing subscription

**Solution:**
```javascript
// Always subscribe
useEffect(() => {
  if (!aggregate?.module) return
  return aggregate.module.subscribe((state) => {
    setData(state.data)
  })
}, [aggregate])
```

### Problem: Aggregate is null

**Cause:** Client not ready

**Solution:**
```javascript
const aggregate = useMemo(() => {
  if (!client) return null // Always check
  return getEventAggregate(eventId, client)
}, [client, eventId])

// Guard in effects
useEffect(() => {
  if (!aggregate?.module) return // Always check
  // ...
}, [aggregate])
```

### Problem: Stale Data

**Cause:** Cache not clearing

**Solution:**
```javascript
import { clearEventAggregate } from '@/aggregates/event/get-event-aggregate'

// Clear on unmount or when needed
useEffect(() => {
  return () => {
    clearEventAggregate(eventId)
  }
}, [eventId])
```

---

## Template: Complete Page Example

See `docs/templates/PageWithAggregate.jsx` for a complete template.

---

## Summary

The Aggregate Pattern provides:
- ✅ Consistent data fetching
- ✅ Built-in state management
- ✅ Automatic caching
- ✅ Reactive updates
- ✅ Clean separation of concerns

**Always use aggregates for:**
- Event-related pages
- VAPP pages (Admin, Ops, Requester)
- Any page that needs data fetching

**When to create a new aggregate:**
- New domain/entity (e.g., Users, Permits, etc.)
- Complex state management needs
- Multiple related operations
