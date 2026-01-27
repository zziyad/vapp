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
import Events from '@/pages/Events'
import EventDetail from '@/pages/EventDetail/index.jsx'
import TransportDemo from '@/pages/TransportDemo'
import DebugAuth from '@/pages/DebugAuth'
import FileManager from '@/pages/FileManager'
import VappRoot from '@/pages/vapp/VappRoot'
import OpsDashboard from '@/pages/vapp/OpsDashboard'
import RequesterDashboard from '@/pages/vapp/RequesterDashboard'
import RequesterRequestsPage from '@/pages/vapp/requester/requests/index.jsx'
import RequesterDraftsPage from '@/pages/vapp/requester/requests/drafts/index.jsx'
import RequesterRequestDetailPage from '@/pages/vapp/requester/requests/[requestId]/index.jsx'
import RequesterNeedInfoPage from '@/pages/vapp/requester/need-info/index.jsx'
import RequesterNotificationsPage from '@/pages/vapp/requester/notifications/index.jsx'
import CreateRequestPage from '@/pages/vapp/requester/requests/new/index.jsx'
import AdminDashboard from '@/pages/vapp/admin/AdminDashboard'
import SectorsPage from '@/pages/vapp/admin/sectors/index.jsx'
import FunctionalAreasPage from '@/pages/vapp/admin/functional-areas/index.jsx'
import VehicleTypesPage from '@/pages/vapp/admin/vehicle-types/index.jsx'
import AccessZonesPage from '@/pages/vapp/admin/access-zones/index.jsx'
import AccessTypesPage from '@/pages/vapp/admin/access-types/index.jsx'
import ValidityPage from '@/pages/vapp/admin/validity/index.jsx'
import ImportancePage from '@/pages/vapp/admin/importance/index.jsx'
import PermitTypesPage from '@/pages/vapp/admin/permit-types/index.jsx'
import EventSetupPage from '@/pages/vapp/admin/event/index.jsx'
import RBACPage from '@/pages/vapp/admin/rbac/index.jsx'
import ReadinessPage from '@/pages/vapp/admin/readiness/index.jsx'
import SerialNumbersPage from '@/pages/vapp/admin/serial-numbers/index.jsx'
import SettingsPage from '@/pages/vapp/admin/settings/index.jsx'
import PagesIndex from '@/pages/PagesIndex/index.jsx'
import VappLayout from '@/components/layout/VappLayout'
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
