# VAPP Documentation

## 📚 Documentation Index

### Data Fetching

- **[Aggregate Pattern Guide](./AGGREGATE_PATTERN_GUIDE.md)** - Complete guide on using the Aggregate Pattern
- **[Aggregate Pattern Quick Reference](./AGGREGATE_PATTERN_QUICK_REFERENCE.md)** - Quick cheat sheet
- **[Aggregate Pattern Template](./templates/PageWithAggregate.jsx)** - Copy-paste template for new pages

### Getting Started

1. **New to aggregates?** Start with [Quick Reference](./AGGREGATE_PATTERN_QUICK_REFERENCE.md)
2. **Need details?** Read the [Complete Guide](./AGGREGATE_PATTERN_GUIDE.md)
3. **Creating a page?** Copy the [Template](./templates/PageWithAggregate.jsx)

---

## 🎯 Aggregate Pattern - Default for All Pages

The Aggregate Pattern is the **default and required** way to fetch data in pages.

### Why Use Aggregates?

- ✅ Built-in state management (loading, error, data)
- ✅ Automatic caching and reuse
- ✅ Reactive subscriptions for real-time updates
- ✅ Consistent error handling
- ✅ Clean separation of concerns

### Quick Example

```javascript
// 1. Create aggregate
const aggregate = useMemo(() => {
  if (!client) return null
  return getEventAggregate(eventId, client)
}, [client, eventId])

// 2. Subscribe to state
useEffect(() => {
  if (!aggregate?.events) return
  return aggregate.events.subscribe((state) => {
    setEvent(state.detail)
    setLoading(state.detailLoading)
  })
}, [aggregate])

// 3. Fetch data
const fetchData = useCallback(async () => {
  if (!aggregate?.events) return
  await aggregate.events.detail(eventId)
}, [aggregate, eventId])
```

See [Complete Guide](./AGGREGATE_PATTERN_GUIDE.md) for full details.

---

## 📖 Other Documentation

- **Data Fetching Analysis**: `../DATA_FETCHING_ANALYSIS.md` - Analysis of current data fetching patterns
- **Aggregate Usage**: `../AGGREGATE_PATTERN_USAGE.md` - Current usage status

---

## 🔗 External Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [React Router Documentation](https://reactrouter.com/)
