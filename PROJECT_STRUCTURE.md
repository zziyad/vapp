# VAPP Project Structure

## Overview

```
vapp/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # shadcn/ui components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   └── label.jsx
│   │   └── ProtectedRoute.jsx  # Auth route wrapper
│   │
│   ├── contexts/            # React Context providers
│   │   └── AuthContext.jsx  # Authentication state management
│   │
│   ├── lib/                 # Utility libraries
│   │   ├── auth/            # Authentication utilities
│   │   │   ├── token-controller.js       # Token management
│   │   │   └── token-refresh-manager.js  # SingleFlight refresh
│   │   ├── config.js        # App configuration
│   │   └── utils.js         # Helper functions (cn, etc.)
│   │
│   ├── pages/               # Page components
│   │   ├── auth/            # Authentication pages
│   │   │   └── Login.jsx
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   └── Home.jsx         # Example page
│   │
│   ├── routes/              # ⭐ Routing configuration
│   │   ├── routes.config.js # Route definitions (ADD ROUTES HERE)
│   │   ├── AppRouter.jsx    # Router component
│   │   ├── index.js         # Exports
│   │   └── README.md        # Routing docs
│   │
│   ├── App.css
│   ├── App.jsx              # App entry point
│   ├── index.css            # Global styles + Tailwind
│   └── main.jsx             # React root
│
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
├── jsconfig.json
├── components.json          # shadcn/ui config
├── .env                     # Environment variables
├── ROUTING.md               # Routing guide
└── README.md
```

## Key Directories

### `/src/routes` - Routing System ⭐
**The heart of navigation**

- **routes.config.js** - Define all routes here
- **AppRouter.jsx** - Automatic route generation
- Add new pages by simply importing and configuring

### `/src/pages` - Page Components
**Organized by feature**

```
pages/
├── auth/          # Authentication flow
├── admin/         # Admin panel (example)
├── users/         # User management (example)
└── Dashboard.jsx  # Main pages
```

### `/src/components` - Reusable Components
**UI building blocks**

- `ui/` - shadcn/ui components
- `ProtectedRoute.jsx` - Auth guard for routes

### `/src/contexts` - State Management
**Global state providers**

- `AuthContext.jsx` - Authentication & user session

### `/src/lib` - Utilities
**Helper functions and configs**

- `auth/` - Token refresh, cross-tab sync
- `config.js` - API URLs, app settings
- `utils.js` - cn() for Tailwind class merging

## Data Flow

```
┌─────────────────────────────────────────┐
│           Browser / User                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         App.jsx (Entry)                 │
│  ├── Router (react-router-dom)         │
│  └── AuthProvider (Auth Context)       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      AppRouter (routes/AppRouter.jsx)   │
│  Reads: routes.config.js                │
│  Generates: Routes automatically        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Route Decision                  │
│  ├── Public? → Render page             │
│  ├── Protected? → Check auth first     │
│  └── Redirect? → Navigate to target    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Page Component (pages/)           │
│  ├── Uses: AuthContext for user data   │
│  ├── Uses: shadcn/ui components        │
│  └── Renders: UI                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      API Communication                  │
│  ├── AuthContext → Backend API         │
│  ├── Token refresh on 401              │
│  └── Cross-tab sync via Broadcast      │
└─────────────────────────────────────────┘
```

## Authentication Flow

```
Login
  ↓
AuthContext.login()
  ↓
POST /api (auth/signin)
  ↓ (cookies set by backend)
Success
  ↓
Fetch user data (auth/me)
  ↓
Update AuthContext.user
  ↓
Navigate to /dashboard
  ↓
Protected Route checks auth
  ↓
Render Dashboard
```

## Token Refresh Flow

```
API Request (auth/me, etc.)
  ↓
Response: 401 Unauthorized
  ↓
AuthContext detects 401
  ↓
executeTokenRefresh()
  ↓
SingleFlight pattern (one refresh at a time)
  ↓
POST /api/auth/refresh (cookies-based)
  ↓
Success? → Retry original request
  ↓
Fail? → Logout & redirect to /login
```

## Component Hierarchy

```
App
└── Router
    └── AuthProvider
        └── AppRouter
            ├── Login (public)
            ├── ProtectedRoute
            │   └── Dashboard (protected)
            └── 404 Page
```

## Styling System

```
Tailwind CSS (utility-first)
  ↓
shadcn/ui (pre-built components)
  ↓
CSS Variables (theming)
  ↓
cn() utility (class merging)
```

## Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite build config, path aliases |
| `tailwind.config.js` | Tailwind CSS customization |
| `jsconfig.json` | Path aliases for imports (@/) |
| `components.json` | shadcn/ui configuration |
| `.env` | Environment variables (API URL) |
| `src/lib/config.js` | App runtime config |

## Adding Features

### Add a new page:
1. Create component in `src/pages/`
2. Add route in `src/routes/routes.config.js`

### Add a new UI component:
```bash
npx shadcn@latest add [component-name]
```

### Add authentication check:
Use `useAuth()` hook in any component

### Add API call:
Use `authenticatedFetch()` from AuthContext

## Best Practices

✅ Keep pages in organized folders  
✅ Use centralized route config  
✅ Leverage shadcn/ui components  
✅ Use AuthContext for user data  
✅ Follow path alias conventions (@/)  
✅ Keep components small and focused  

## Getting Started

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Add a new route:**
   - Edit `src/routes/routes.config.js`
   - Create page in `src/pages/`

3. **Add shadcn component:**
   ```bash
   npx shadcn@latest add button
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Documentation

- **Routing Guide**: See `ROUTING.md`
- **Routing Details**: See `src/routes/README.md`
- **General Info**: See `README.md`
