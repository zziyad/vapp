# VAPP Data Fetching Analysis

## Overview

The vapp app uses a **dual-transport system** (HTTP + WebSocket) with a unified `Client` interface. Data fetching patterns vary across components.

## Transport Architecture

### 1. Transport Client (`Client.js`)

```javascript
// Unified client that routes calls to appropriate transport
client.call(method, args)
```

**Transport Selection Logic:**
- **Auth calls** (`auth/*`) → Always use **HTTP**
- **All other calls** → Use **WebSocket** (requires connection)

**Key Methods:**
- `client.call(method, args)` - Unified interface
- `client.httpTransport.call(method, args)` - Force HTTP
- `client.wsTransport.call(method, args)` - Force WebSocket
- `client.api.{namespace}.{method}(args)` - API proxy (not widely used)

### 2. Transport Context

```javascript
const { client, wsConnected, httpConnected } = useTransport()
```

**State:**
- `client` - Transport client instance
- `wsConnected` - WebSocket connection status
- `httpConnected` - HTTP availability (always true)

## Current Data Fetching Patterns

### Pattern 1: Direct `client.call()` (Recommended)

**Location:** `AdminDashboard.jsx`

```javascript
const { client, wsConnected } = useTransport()

const loadData = async () => {
  if (!wsConnected || !eventId || !client) return
  
  // Use unified client.call() - automatically routes to WebSocket
  const result = await vappConfigApi.permitType.list(
    client.call.bind(client), 
    eventId
  )
}
```

**Pros:**
- Uses unified interface
- Automatic transport selection
- Cleaner code

**Cons:**
- Requires `wsConnected` check
- May fail if WebSocket not connected

### Pattern 2: Direct `wsTransport.call()` (Common)

**Locations:** `use-event-readiness.js`, `OpsDashboard.jsx`, `RequesterDashboard.jsx`

```javascript
const { client, wsConnected } = useTransport()

const loadData = async () => {
  if (!wsConnected || !client?.wsTransport) return
  
  // Direct WebSocket call
  const call = client.wsTransport.call.bind(client.wsTransport)
  const result = await vappConfigApi.readiness(call, eventId)
}
```

**Pros:**
- Explicit WebSocket usage
- Direct control

**Cons:**
- Bypasses unified interface
- Requires manual connection check
- Inconsistent with `client.call()` pattern

### Pattern 3: Aggregate Pattern (Advanced)

**Locations:** `Events/index.jsx`, `EventDetail/index.jsx`

```javascript
const { client } = useTransport()

// Create aggregate (cached, stateful)
const aggregate = useMemo(() => {
  if (!client) return null
  return getEventAggregate(eventId, client)
}, [client, eventId])

// Subscribe to state changes
useEffect(() => {
  if (!aggregate?.events) return
  return aggregate.events.subscribe((state) => {
    setEvent(state.detail)
    setLoading(state.detailLoading)
  })
}, [aggregate])

// Trigger fetch
const fetchEvent = useCallback(async () => {
  if (!aggregate?.events || !eventId) return
  await aggregate.events.detail(eventId)
}, [aggregate, eventId])
```

**Pros:**
- State management built-in
- Caching and subscriptions
- Reactive updates
- Clean separation of concerns

**Cons:**
- More complex setup
- Requires aggregate creation
- Learning curve

## Issues Found

### 1. Inconsistent Transport Usage

**Problem:** Mixed usage of `client.call()` vs `client.wsTransport.call()`

**Examples:**
- ✅ `AdminDashboard.jsx` uses `client.call.bind(client)`
- ❌ `use-event-readiness.js` uses `client.wsTransport.call.bind(client.wsTransport)`
- ❌ `OpsDashboard.jsx` uses `client.wsTransport.call.bind(client.wsTransport)`

**Impact:** 
- Inconsistent behavior
- Harder to maintain
- Potential bugs if transport logic changes

### 2. Response Format Handling

**Problem:** Different components handle responses differently

**Example 1 - AdminDashboard:**
```javascript
if (permitTypesResult?.status === 'fulfilled' && permitTypesResult?.response) {
  setPermitTypes(permitTypesResult.response.permitTypes || permitTypesResult.response || [])
}
```

**Example 2 - use-event-readiness:**
```javascript
if (result?.status === "fulfilled" && result?.response) {
  const isReady = result.response.isReady || result.response.ready || false
  setReadiness(isReady ? "READY" : "NOT_READY")
}
```

**Issue:** 
- WebSocket transport returns data directly (not wrapped in `{status, response}`)
- HTTP transport may return wrapped responses
- Components assume different response formats

### 3. Connection State Checks

**Problem:** Inconsistent connection state checking

**Pattern A:**
```javascript
if (!wsConnected || !eventId || !client) return
```

**Pattern B:**
```javascript
if (!wsConnected || !eventId || !client?.wsTransport) return
```

**Pattern C:**
```javascript
// No check at all (in aggregates)
```

**Impact:**
- Some components may fail silently
- Some may throw errors
- Unpredictable behavior

### 4. Error Handling

**Problem:** Inconsistent error handling

**Example 1:**
```javascript
try {
  const result = await vappConfigApi.permitType.list(...)
  // Process result
} catch (error) {
  console.error('Failed to load config data:', error)
  // No user feedback
}
```

**Example 2:**
```javascript
try {
  await aggregate.events.detail(eventId)
} catch (err) {
  if (!eventRef.current && !location?.state?.event) {
    setError(err?.message || 'Failed to load event')
  }
}
```

**Impact:**
- Some errors are logged but not shown to user
- Some errors are shown but inconsistently
- No global error handling strategy

## Recommendations

### 1. Standardize on `client.call()`

**Use unified interface everywhere:**
```javascript
const { client, wsConnected } = useTransport()

const loadData = async () => {
  if (!client) return
  
  try {
    // client.call() handles transport selection automatically
    const result = await client.call('vapp.config.permitType.list', {
      event_id: eventId
    })
    
    // Handle direct response (WebSocket returns data directly)
    setPermitTypes(Array.isArray(result) ? result : result?.permitTypes || [])
  } catch (error) {
    // Handle error
  }
}
```

### 2. Create Custom Hooks

**Create reusable hooks for common patterns:**
```javascript
// hooks/use-vapp-config.js
export function useVappConfig(eventId) {
  const { client, wsConnected } = useTransport()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const fetch = useCallback(async () => {
    if (!client || !eventId) return
    
    try {
      setLoading(true)
      setError(null)
      const result = await client.call('vapp.config.permitType.list', {
        event_id: eventId
      })
      setData(Array.isArray(result) ? result : result?.permitTypes || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [client, eventId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}
```

### 3. Standardize Response Handling

**Create response normalizer:**
```javascript
// lib/transport/response-normalizer.js
export function normalizeResponse(result) {
  // Handle WebSocket direct response
  if (!result || typeof result !== 'object') return result
  
  // Handle wrapped response
  if (result.status === 'fulfilled' && result.response) {
    return result.response
  }
  
  // Handle error response
  if (result.status === 'rejected') {
    throw new Error(result.error?.message || 'Request failed')
  }
  
  // Return as-is
  return result
}
```

### 4. Add Global Error Handling

**Create error boundary or toast notifications:**
```javascript
// hooks/use-toast.js or use error boundary
import { toast } from 'sonner' // or similar

const loadData = async () => {
  try {
    // ...
  } catch (error) {
    toast.error(error.message || 'Failed to load data')
    console.error(error)
  }
}
```

## Summary

**Current State:**
- ✅ Dual transport system works
- ✅ Aggregates pattern is powerful
- ❌ Inconsistent usage patterns
- ❌ Response format confusion
- ❌ Error handling varies

**Recommended Actions:**
1. Standardize on `client.call()` everywhere
2. Create reusable hooks for common operations
3. Normalize response handling
4. Add consistent error handling
5. Document patterns in README
