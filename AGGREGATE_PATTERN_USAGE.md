# Aggregate Pattern Usage

## Overview

The **Aggregate Pattern** is the **default** data fetching pattern for:
- ✅ Event Detail pages
- ✅ Manager/Config (Admin) pages  
- ✅ VAPP pages (Ops, Requester)

## Current Status

### ✅ Using Aggregate Pattern

1. **EventDetail** (`/events/:eventId`)
   - Uses `getEventAggregate(eventId, client)`
   - Subscribes to state changes
   - Reactive updates

2. **Events List** (`/events`, `/dashboard`)
   - Uses `getEventAggregate(null, client)` for list view
   - Aggregate pattern with subscriptions

### ⚠️ Should Use Aggregate Pattern (Currently Direct Calls)

1. **AdminDashboard** (`/events/:eventId/vapp/admin/dashboard`)
   - Currently uses `client.call()` directly
   - Should be converted to aggregate pattern
   - Location: `components/vapp/admin/dashboard/AdminDashboard.jsx`

2. **OpsDashboard** (`/events/:eventId/vapp/ops/dashboard`)
   - Component uses direct `wsTransport.call()`
   - Should use aggregate pattern
   - Location: `components/vapp/ops/dashboard/OpsDashboard.jsx`

3. **RequesterDashboard** (`/events/:eventId/vapp/requester/dashboard`)
   - Component uses direct `wsTransport.call()`
   - Should use aggregate pattern
   - Location: `components/vapp/requester/dashboard/RequesterDashboard.jsx`

## Aggregate Pattern Implementation

### Example: EventDetail

```javascript
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'

export default function EventDetail() {
  const { client } = useTransport()
  const { eventId } = useParams()

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
      setError(state.detailError)
    })
  }, [aggregate])

  // Trigger fetch
  const fetchEvent = useCallback(async () => {
    if (!aggregate?.events || !eventId) return
    await aggregate.events.detail(eventId)
  }, [aggregate, eventId])
}
```

## Benefits of Aggregate Pattern

1. **State Management** - Built-in state with loading/error handling
2. **Caching** - Aggregates are cached and reused
3. **Subscriptions** - Reactive updates when data changes
4. **Consistency** - Same pattern across all event-related pages
5. **Separation of Concerns** - Business logic in aggregates, UI in components

## Creating New Aggregates

To create a new aggregate for VAPP config:

1. Create aggregate file: `aggregates/vapp-config/create-vapp-config-aggregate.js`
2. Create module: `aggregates/vapp-config/modules/create-config-module.js`
3. Export getter: `aggregates/vapp-config/get-vapp-config-aggregate.js`
4. Use in components:

```javascript
import { getVappConfigAggregate } from '@/aggregates/vapp-config/get-vapp-config-aggregate'

const aggregate = useMemo(() => {
  if (!client) return null
  return getVappConfigAggregate(eventId, client)
}, [client, eventId])
```

## Migration Plan

1. ✅ EventDetail - Already using aggregate
2. ⏳ AdminDashboard - Convert to aggregate
3. ⏳ OpsDashboard - Convert to aggregate  
4. ⏳ RequesterDashboard - Convert to aggregate

## Pages Index

View all pages at: `/pages`

This page shows:
- All available routes
- Route metadata (title, description, protection)
- Direct links to each page
- Grouped by category (Main, VAPP, Auth, Dev)
