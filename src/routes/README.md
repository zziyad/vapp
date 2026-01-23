# Routes Documentation

This folder contains the centralized routing configuration for the application.

## Structure

```
routes/
├── routes.config.js  # Route definitions and configuration
├── AppRouter.jsx     # Main router component
├── index.js          # Barrel exports
└── README.md         # This file
```

## Adding a New Route

To add a new route to the application:

### 1. Create your page component

```bash
# Example: Create a Users page
mkdir -p src/pages/users
touch src/pages/users/Users.jsx
```

### 2. Add route to `routes.config.js`

```javascript
import Users from '@/pages/users/Users'

export const routes = [
  // ... existing routes
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

That's it! The route is now available at `/users`.

## Route Configuration Options

### Basic Route
```javascript
{
  path: '/example',           // Required: URL path
  component: ExampleComponent, // Required: Component to render
  protected: false,            // Optional: Requires auth (default: false)
  meta: {                      // Optional: Route metadata
    title: 'Example',
    description: 'Example page',
  },
}
```

### Redirect Route
```javascript
{
  path: '/old-path',
  redirect: '/new-path',  // Automatically redirects
}
```

### Protected Route
```javascript
{
  path: '/admin',
  component: Admin,
  protected: true,  // Automatically wrapped with ProtectedRoute
}
```

## Route Types

### Public Routes
- No authentication required
- Accessible to everyone
- Example: `/login`

### Protected Routes
- Requires authentication
- Redirects to `/login` if not authenticated
- Example: `/dashboard`, `/users`

### Redirect Routes
- Automatically redirects to another path
- Useful for URL aliases or deprecation
- Example: `/` → `/dashboard`

## Helper Functions

### `getRouteByPath(path)`
Get route configuration by path.

```javascript
import { getRouteByPath } from '@/routes'

const route = getRouteByPath('/dashboard')
console.log(route.meta.title) // "Dashboard"
```

### `isProtectedRoute(path)`
Check if a path requires authentication.

```javascript
import { isProtectedRoute } from '@/routes'

if (isProtectedRoute('/dashboard')) {
  // Route requires authentication
}
```

## Best Practices

1. **Group related routes**: Keep related pages in the same folder
   ```
   pages/
   ├── auth/
   │   ├── Login.jsx
   │   └── Register.jsx
   ├── users/
   │   ├── Users.jsx
   │   └── UserDetail.jsx
   ```

2. **Use meaningful paths**: Make URLs descriptive and RESTful
   ```javascript
   '/users'           // List users
   '/users/:id'       // User detail
   '/users/:id/edit'  // Edit user
   ```

3. **Add metadata**: Include title and description for SEO
   ```javascript
   meta: {
     title: 'Users - Admin',
     description: 'Manage system users',
   }
   ```

4. **Keep routes sorted**: Organize by feature or alphabetically
   ```javascript
   // Auth routes
   { path: '/login', ... },
   { path: '/register', ... },
   
   // Admin routes
   { path: '/admin', ... },
   { path: '/users', ... },
   ```

## Examples

### Adding a Settings Page

```javascript
// 1. Create component
// src/pages/settings/Settings.jsx
export default function Settings() {
  return <div>Settings Page</div>
}

// 2. Add to routes.config.js
import Settings from '@/pages/settings/Settings'

export const routes = [
  // ... other routes
  {
    path: '/settings',
    component: Settings,
    protected: true,
    meta: {
      title: 'Settings',
      description: 'Application settings',
    },
  },
]
```

### Adding Nested Routes

For complex nested routing, you can use React Router's nested routes:

```javascript
import { Outlet } from 'react-router-dom'

// Parent Layout
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
  path: '/admin',
  component: AdminLayout,
  protected: true,
  children: [
    { path: 'users', component: AdminUsers },
    { path: 'settings', component: AdminSettings },
  ],
}
```

## Troubleshooting

**Route not working?**
1. Check the path starts with `/`
2. Verify component is imported correctly
3. Make sure the route is added to `routes.config.js`

**Protected route not redirecting?**
1. Check `protected: true` is set
2. Verify `ProtectedRoute` component is working
3. Check authentication state in AuthContext

**404 page showing for valid route?**
1. Check for typos in the path
2. Verify component import path
3. Clear browser cache
