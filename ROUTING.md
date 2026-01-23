# Routing System Documentation

## Overview

The application uses a centralized routing configuration system that makes it easy to add, modify, and manage routes.

## Structure

```
src/
├── routes/
│   ├── routes.config.js    # ✨ Route definitions (add new routes here)
│   ├── AppRouter.jsx        # Main router component
│   ├── index.js             # Barrel exports
│   └── README.md            # Detailed routing docs
├── pages/
│   ├── auth/                # Authentication pages
│   │   └── Login.jsx
│   ├── Dashboard.jsx        # Protected pages
│   └── Home.jsx             # Example pages
├── components/
│   └── ProtectedRoute.jsx   # Route wrapper for auth
└── App.jsx                  # App entry point
```

## Quick Start: Adding a New Route

### Step 1: Create Your Page Component

```bash
# Create a new page
touch src/pages/Users.jsx
```

```jsx
// src/pages/Users.jsx
export default function Users() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Users</h1>
      <p>Manage users here</p>
    </div>
  )
}
```

### Step 2: Add to routes.config.js

```javascript
// src/routes/routes.config.js
import Users from '@/pages/Users'

export const routes = [
  // ... existing routes
  
  // Add your new route
  {
    path: '/users',
    component: Users,
    protected: true,  // Requires authentication
    meta: {
      title: 'Users',
      description: 'User management page',
    },
  },
]
```

**That's it!** Your route is now available at `/users` 🎉

## Route Configuration Options

```javascript
{
  path: '/example',           // Required: URL path
  component: ExampleComponent, // Required: Component to render
  protected: false,            // Optional: Requires auth (default: false)
  redirect: '/other-path',    // Optional: Redirect instead of render
  meta: {                      // Optional: Route metadata
    title: 'Example',
    description: 'Example page',
  },
}
```

## Route Types

### 1. Public Routes
No authentication required, accessible to everyone.

```javascript
{
  path: '/about',
  component: About,
  protected: false,
}
```

### 2. Protected Routes
Requires authentication, redirects to `/login` if not authenticated.

```javascript
{
  path: '/dashboard',
  component: Dashboard,
  protected: true,
}
```

### 3. Redirect Routes
Automatically redirects to another path.

```javascript
{
  path: '/old-url',
  redirect: '/new-url',
}
```

## Examples

### Example 1: Settings Page

```javascript
// 1. Create component
// src/pages/Settings.jsx
export default function Settings() {
  return <div>Settings</div>
}

// 2. Add to routes
import Settings from '@/pages/Settings'

export const routes = [
  // ...
  {
    path: '/settings',
    component: Settings,
    protected: true,
  },
]
```

### Example 2: Public About Page

```javascript
// src/pages/About.jsx
export default function About() {
  return <div>About Us</div>
}

// Add to routes
{
  path: '/about',
  component: About,
  protected: false,
}
```

### Example 3: Admin Panel

```javascript
// Organized in folder
// src/pages/admin/Admin.jsx

// Add to routes
{
  path: '/admin',
  component: Admin,
  protected: true,
  meta: {
    title: 'Admin Panel',
    description: 'Administrative dashboard',
  },
}
```

## Helper Functions

### getRouteByPath(path)
Get route configuration by path.

```javascript
import { getRouteByPath } from '@/routes'

const route = getRouteByPath('/dashboard')
console.log(route.meta.title) // "Dashboard"
```

### isProtectedRoute(path)
Check if a path requires authentication.

```javascript
import { isProtectedRoute } from '@/routes'

if (isProtectedRoute('/admin')) {
  // Route requires authentication
}
```

## Organization Best Practices

### 1. Group Related Pages in Folders

```
pages/
├── auth/           # Authentication pages
│   ├── Login.jsx
│   └── Register.jsx
├── admin/          # Admin pages
│   ├── Dashboard.jsx
│   └── Users.jsx
└── public/         # Public pages
    ├── Home.jsx
    └── About.jsx
```

### 2. Keep Routes Sorted in Config

```javascript
export const routes = [
  // Auth routes
  { path: '/login', ... },
  { path: '/register', ... },
  
  // Admin routes
  { path: '/admin', ... },
  { path: '/admin/users', ... },
  
  // Public routes
  { path: '/about', ... },
]
```

### 3. Use Descriptive Paths

```javascript
// Good
'/users'
'/users/:id'
'/users/:id/edit'
'/settings/profile'

// Avoid
'/u'
'/user-page'
'/settings123'
```

## Current Routes

| Path | Component | Protected | Description |
|------|-----------|-----------|-------------|
| `/` | Redirect → `/dashboard` | - | Home redirect |
| `/login` | Login | No | Login page |
| `/dashboard` | Dashboard | Yes | User dashboard |

## 404 Handling

The router automatically shows a 404 page for undefined routes:

```
┌─────────────────────────┐
│         404             │
│    Page not found       │
│  [Go to Dashboard]      │
└─────────────────────────┘
```

## Advanced: Nested Routes

For complex nested routing:

```javascript
import { Outlet } from 'react-router-dom'

function AdminLayout() {
  return (
    <div>
      <AdminSidebar />
      <Outlet /> {/* Child routes render here */}
    </div>
  )
}

// In routes.config.js
{
  path: '/admin/*',
  component: AdminLayout,
  protected: true,
}

// Then in AdminLayout, add nested routes
```

## Troubleshooting

**Route not working?**
- Check path starts with `/`
- Verify component import is correct
- Clear browser cache

**Protected route not redirecting to login?**
- Check `protected: true` is set
- Verify AuthProvider is wrapping the router
- Check browser console for errors

**Changes not reflecting?**
- HMR should auto-reload
- If not, refresh the browser manually
- Check terminal for build errors

## Benefits of This System

✅ **Easy to maintain** - All routes in one file  
✅ **Type-safe** - Can add TypeScript types easily  
✅ **Consistent** - Same pattern for all routes  
✅ **Automatic** - No manual route component creation  
✅ **Flexible** - Easy to add features (layouts, permissions, etc.)  
✅ **Self-documenting** - Clear route structure  

## Need Help?

Check the detailed documentation in `src/routes/README.md`
