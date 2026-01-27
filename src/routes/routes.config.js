/**
 * Centralized Route Configuration
 * 
 * Define all application routes in one place for easy management.
 * Each route can specify:
 * - path: URL path
 * - component: Component to render (can be lazy-loaded)
 * - protected: Whether route requires authentication (default: false)
 * - redirect: Redirect to another path (optional)
 * - layout: Custom layout component (optional)
 * - meta: Additional metadata (title, description, etc.)
 * 
 * NOTE: Components are lazy-loaded for code splitting and better performance.
 * Only the layout component (VappLayout) is eagerly loaded as it's used frequently.
 */

import { lazy } from 'react'
import VappLayout from '@/components/layout/VappLayout'

// Lazy load page components for code splitting
const Login = lazy(() => import('@/pages/auth/Login'))
const Events = lazy(() => import('@/pages/Events'))
const EventDetail = lazy(() => import('@/pages/EventDetail/index.jsx'))
const TransportDemo = lazy(() => import('@/pages/TransportDemo'))
const DebugAuth = lazy(() => import('@/pages/DebugAuth'))
const FileManager = lazy(() => import('@/pages/FileManager'))
const VappRoot = lazy(() => import('@/pages/vapp/VappRoot'))
const OpsDashboard = lazy(() => import('@/pages/vapp/OpsDashboard'))
const RequesterDashboard = lazy(() => import('@/pages/vapp/RequesterDashboard'))
const RequesterRequestsPage = lazy(() => import('@/pages/vapp/requester/requests/index.jsx'))
const RequesterDraftsPage = lazy(() => import('@/pages/vapp/requester/requests/drafts/index.jsx'))
const RequesterRequestDetailPage = lazy(() => import('@/pages/vapp/requester/requests/[requestId]/index.jsx'))
const RequesterNeedInfoPage = lazy(() => import('@/pages/vapp/requester/need-info/index.jsx'))
const RequesterNotificationsPage = lazy(() => import('@/pages/vapp/requester/notifications/index.jsx'))
const CreateRequestPage = lazy(() => import('@/pages/vapp/requester/requests/new/index.jsx'))
const AdminDashboard = lazy(() => import('@/pages/vapp/admin/AdminDashboard'))
const SectorsPage = lazy(() => import('@/pages/vapp/admin/sectors/index.jsx'))
const FunctionalAreasPage = lazy(() => import('@/pages/vapp/admin/functional-areas/index.jsx'))
const VehicleTypesPage = lazy(() => import('@/pages/vapp/admin/vehicle-types/index.jsx'))
const AccessZonesPage = lazy(() => import('@/pages/vapp/admin/access-zones/index.jsx'))
const AccessTypesPage = lazy(() => import('@/pages/vapp/admin/access-types/index.jsx'))
const ValidityPage = lazy(() => import('@/pages/vapp/admin/validity/index.jsx'))
const ImportancePage = lazy(() => import('@/pages/vapp/admin/importance/index.jsx'))
const PermitTypesPage = lazy(() => import('@/pages/vapp/admin/permit-types/index.jsx'))
const EventSetupPage = lazy(() => import('@/pages/vapp/admin/event/index.jsx'))
const RBACPage = lazy(() => import('@/pages/vapp/admin/rbac/index.jsx'))
const ReadinessPage = lazy(() => import('@/pages/vapp/admin/readiness/index.jsx'))
const SerialNumbersPage = lazy(() => import('@/pages/vapp/admin/serial-numbers/index.jsx'))
const SettingsPage = lazy(() => import('@/pages/vapp/admin/settings/index.jsx'))
const PagesIndex = lazy(() => import('@/pages/PagesIndex/index.jsx'))
// const Home = lazy(() => import('@/pages/Home'))

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
    path: '/events',
    component: Events,
    protected: true,
    meta: {
      title: 'Events',
      description: 'Events list',
    },
  },
  // More specific routes must come before less specific ones
  {
    path: '/events/:eventId/vapp/admin/dashboard',
    component: AdminDashboard,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'VAPP Admin Dashboard',
      description: 'Manager / Config dashboard',
    },
  },
  // Config entities - Domain A
  {
    path: '/events/:eventId/vapp/admin/sectors',
    component: SectorsPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Sectors',
      description: 'Manage organizational sectors',
    },
  },
  {
    path: '/events/:eventId/vapp/admin/functional-areas',
    component: FunctionalAreasPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Functional Areas',
      description: 'Manage functional areas',
    },
  },
  {
    path: '/events/:eventId/vapp/admin/vehicle-types',
    component: VehicleTypesPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Vehicle Types',
      description: 'Manage vehicle types',
    },
  },
  {
    path: '/events/:eventId/vapp/admin/access-zones',
    component: AccessZonesPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Access Zones',
      description: 'Manage access zones',
    },
  },
  {
    path: '/events/:eventId/vapp/admin/access-types',
    component: AccessTypesPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Access Types',
      description: 'Manage access types',
    },
  },
  {
    path: '/events/:eventId/vapp/admin/validity',
    component: ValidityPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Validity',
      description: 'Manage validity periods',
    },
  },
  {
    path: '/events/:eventId/vapp/admin/importance',
    component: ImportancePage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Importance',
      description: 'View importance levels',
    },
  },
  {
    path: '/events/:eventId/vapp/admin/permit-types',
    component: PermitTypesPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Permit Types',
      description: 'Manage permit types and their configurations',
    },
  },
  {
    path: '/events/:eventId/vapp/admin/event',
    component: EventSetupPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Event Setup',
      description: 'Configure event-specific VAPP settings',
    },
  },
  {
    path: '/events/:eventId/vapp/admin/rbac',
    component: RBACPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'RBAC / Permissions',
      description: 'Manage roles and permissions for VAPP',
    },
  },
  {
    path: '/events/:eventId/vapp/admin/readiness',
    component: ReadinessPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Readiness Checklist',
      description: 'Verify all required configuration is complete',
    },
  },
  {
    path: '/events/:eventId/vapp/admin/serial-numbers',
    component: SerialNumbersPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Serial Number Pool',
      description: 'Generate and manage serial numbers for permit types and subtypes',
    },
  },
  {
    path: '/events/:eventId/vapp/admin/settings',
    component: SettingsPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Event Settings',
      description: 'Configure event-specific VAPP settings',
    },
  },
  {
    path: '/events/:eventId/vapp/ops/dashboard',
    component: OpsDashboard,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'VAPP Ops Dashboard',
      description: 'Operations dashboard',
    },
  },
  {
    path: '/events/:eventId/vapp/requester/dashboard',
    component: RequesterDashboard,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'VAPP Requester Dashboard',
      description: 'Requester dashboard',
    },
  },
  {
    path: '/events/:eventId/vapp/requester/requests/new',
    component: CreateRequestPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Create Request',
      description: 'Create a new access request',
    },
  },
  {
    path: '/events/:eventId/vapp/requester/requests/:requestId',
    component: RequesterRequestDetailPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Edit Request',
      description: 'View and edit your access request',
    },
  },
  {
    path: '/events/:eventId/vapp/requester/requests/drafts',
    component: RequesterDraftsPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Drafts',
      description: 'Continue editing your draft requests',
    },
  },
  {
    path: '/events/:eventId/vapp/requester/requests',
    component: RequesterRequestsPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'My Requests',
      description: 'View and manage your access requests',
    },
  },
  {
    path: '/events/:eventId/vapp/requester/need-info',
    component: RequesterNeedInfoPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Need Info',
      description: 'Requests that need additional information or corrections',
    },
  },
  {
    path: '/events/:eventId/vapp/requester/notifications',
    component: RequesterNotificationsPage,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Notifications',
      description: 'View notifications and messages about your requests',
    },
  },
  {
    path: '/events/:eventId/vapp',
    component: VappRoot,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'VAPP',
      description: 'VAPP workspace routing',
    },
  },
  {
    path: '/events/:eventId',
    component: EventDetail,
    protected: true,
    layout: VappLayout,
    meta: {
      title: 'Event Detail',
      description: 'Event dashboard',
    },
  },

  // ========================================
  // ADD NEW ROUTES HERE
  // ========================================
  
  // Pages Index - Overview of all pages
  {
    path: '/pages',
    component: PagesIndex,
    protected: true,
    meta: {
      title: 'Pages Index',
      description: 'Complete list of all available pages',
    },
  },
  
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

  // File Manager (upload + download)
  {
    path: '/files',
    component: FileManager,
    protected: true,
    meta: {
      title: 'File Manager',
      description: 'Upload, download, and manage files',
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
    redirect: '/events',
  },
  {
    path: '/dashboard',
    redirect: '/events',
  },
]

// Route groups for better organization (optional)
export const routeGroups = {
  auth: ['/login'],
  protected: ['/events'],
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
