/**
 * Centralized Route Configuration
 * 
 * Define all application routes in one place for easy management.
 * Each route can specify:
 * - path: URL path
 * - component: Component to render
 * - protected: Whether route requires authentication (default: false)
 * - redirect: Redirect to another path (optional)
 * - layout: Custom layout component (optional)
 * - meta: Additional metadata (title, description, etc.)
 */

// Import page components
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/Dashboard'
import TransportDemo from '@/pages/TransportDemo'
import DebugAuth from '@/pages/DebugAuth'
// import Home from '@/pages/Home'

/**
 * Routes Configuration
 * 
 * Add new routes by:
 * 1. Import your component above
 * 2. Add route object to the routes array below
 * 3. That's it! The router will automatically handle it
 */
export const routes = [
  // ========================================
  // PUBLIC ROUTES (no authentication required)
  // ========================================

  // Uncomment to add a public home page:
  // {
  //   path: '/',
  //   component: Home,
  //   protected: false,
  //   meta: {
  //     title: 'Home',
  //     description: 'Welcome to VAPP',
  //   },
  // },

  // ========================================
  // AUTH ROUTES
  // ========================================
  {
    path: '/login',
    component: Login,
    protected: false,
    meta: {
      title: 'Login',
      description: 'Sign in to your account',
    },
  },

  // ========================================
  // PROTECTED ROUTES (authentication required)
  // ========================================
  {
    path: '/dashboard',
    component: Dashboard,
    protected: true,
    meta: {
      title: 'Dashboard',
      description: 'User dashboard and session information',
    },
  },

  // ========================================
  // ADD NEW ROUTES HERE
  // ========================================
  
  // Debug Auth (for development/testing)
  {
    path: '/debug-auth',
    component: DebugAuth,
    protected: false, // Not protected so we can test from any state
    meta: {
      title: 'Debug Auth',
      description: 'Authentication debugging panel',
    },
  },
  
  // Transport Demo (for development/testing)
  {
    path: '/transport-demo',
    component: TransportDemo,
    protected: true,
    meta: {
      title: 'Transport Demo',
      description: 'HTTP and WebSocket transport testing',
    },
  },
  
  // Example:
  // {
  //   path: '/users',
  //   component: Users,
  //   protected: true,
  //   meta: {
  //     title: 'Users',
  //     description: 'User management',
  //   },
  // },

  // ========================================
  // REDIRECTS
  // ========================================
  {
    path: '/',
    redirect: '/dashboard',
  },
]

// Route groups for better organization (optional)
export const routeGroups = {
  auth: ['/login'],
  protected: ['/dashboard'],
  public: [],
}

// Helper function to get route by path
export const getRouteByPath = (path) => {
  return routes.find((route) => route.path === path)
}

// Helper function to check if path requires authentication
export const isProtectedRoute = (path) => {
  const route = getRouteByPath(path)
  return route?.protected ?? false
}
