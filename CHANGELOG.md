# Changelog

## [2.0.0] - Transport System Implementation

### ✨ New Features

#### Transport Layer
- **Dual Transport System**: HTTP and WebSocket support
- **Unified Client API**: Single interface for all API calls
- **Auto-Fallback**: Graceful degradation WS→HTTP
- **Auto-Reconnect**: WebSocket automatic reconnection
- **Event System**: Real-time server events via WebSocket
- **API Proxy**: Convenient `client.api.namespace.method()` calls

#### Architecture
- `Transport` - Base class for all transports
- `HttpTransport` - Fetch-based HTTP transport
- `WebSocketTransport` - WebSocket transport with events
- `Client` - Unified interface managing both transports
- `TransportProvider` - React context for transport client
- `TransportContext` - React hooks integration

### 📝 Changed

#### Authentication
- **AuthContext**: Refactored to use transport client
- **Simplified**: Removed manual fetch/JSON parsing
- **Error Handling**: Unified error format across all calls
- **Token Refresh**: Still works with new transport system
- **Cross-tab Sync**: Still works via BroadcastChannel

#### App Structure
- **App.jsx**: Added `TransportProvider` wrapper
- **Routes**: Added `/transport-demo` development route

### 📂 New Files

```
src/lib/transport/
├── Transport.js          # Base transport class
├── HttpTransport.js      # HTTP implementation
├── WebSocketTransport.js # WebSocket implementation
├── Client.js             # Unified client
├── index.js              # Barrel exports
└── README.md             # Transport docs

src/contexts/
├── TransportContext.jsx  # Transport React context
└── AuthContext.old.jsx   # Backup of old auth

src/pages/
└── TransportDemo.jsx     # Demo/testing page

docs/
├── TRANSPORT_MIGRATION.md
├── TRANSPORT_QUICK_START.md
└── CHANGELOG.md (this file)
```

### 🔄 Migration Path

1. Old `AuthContext` backed up as `AuthContext.old.jsx`
2. New `AuthContext` uses transport client
3. All existing auth functionality preserved
4. Zero breaking changes for components using `useAuth()`

### 🧪 Testing

- Visit `/transport-demo` for live testing
- HTTP transport: Always available
- WebSocket transport: Auto-connects in background
- All existing auth flows tested and working

### 📊 Comparison

| Feature | Old System | New System |
|---------|-----------|------------|
| HTTP Calls | ✅ Manual fetch | ✅ `client.api.x.y()` |
| WebSocket | ❌ Not supported | ✅ Full support |
| Error Handling | ⚠️ Inconsistent | ✅ Unified |
| Real-time Events | ❌ No | ✅ Yes |
| Auto-Reconnect | ❌ No | ✅ Yes |
| Fallback | ❌ No | ✅ Auto WS→HTTP |
| Type Safety | ⚠️ Manual | ✅ Consistent API |
| Code Complexity | 🟡 Medium | 🟢 Low |

### 🎯 Benefits

1. **Developer Experience**: Clean API, less boilerplate
2. **Reliability**: Auto-reconnect, fallback handling
3. **Future-Proof**: Ready for streaming, events
4. **Maintainability**: Centralized transport logic
5. **Type Safety**: Consistent interface
6. **Debugging**: Better error messages

### ⚙️ Configuration

```bash
# .env
VITE_API_URL=http://localhost:8005
VITE_WS_URL=ws://localhost:8005/ws
```

### 📚 Documentation

- `TRANSPORT_QUICK_START.md` - Get started in 2 minutes
- `TRANSPORT_MIGRATION.md` - Full migration guide
- `src/lib/transport/README.md` - Technical docs

### 🔜 Future Plans

- [ ] File upload/download streaming
- [ ] Progress tracking for uploads
- [ ] Server-sent events (SSE) fallback
- [ ] Request cancellation
- [ ] Request deduplication
- [ ] Caching layer
- [ ] Offline support

---

## [1.0.0] - Initial Release

### Features
- React + Vite setup
- shadcn/ui components
- Authentication system
- Token refresh mechanism
- Cross-tab synchronization
- Protected routes
- Dashboard with user info
- Responsive UI

### Architecture
- React Router v6
- Cookie-based auth
- RPC protocol
- Metarhia backend
- SingleFlight pattern
- BroadcastChannel sync
