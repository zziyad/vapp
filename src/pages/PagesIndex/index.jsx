import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { routes } from '@/routes/routes.config'
import { 
  Home, 
  Lock, 
  Unlock, 
  LayoutDashboard,
  FileText,
  Settings,
  TestTube,
  FolderOpen,
  Upload,
  Bug,
  Shield
} from 'lucide-react'

const iconMap = {
  'Login': Lock,
  'Events': LayoutDashboard,
  'Event Detail': FileText,
  'VAPP': Settings,
  'VAPP Admin Dashboard': Settings,
  'VAPP Ops Dashboard': Settings,
  'VAPP Requester Dashboard': Settings,
  'Transport Demo': TestTube,
  'File Manager': FolderOpen,
  'File Upload Test': Upload,
  'Debug Auth': Bug,
}

function getIcon(title) {
  return iconMap[title] || Home
}

function groupRoutes(routes) {
  const groups = {
    public: [],
    auth: [],
    main: [],
    vapp: [],
    dev: [],
  }

  routes.forEach((route) => {
    if (route.redirect) return

    const routeInfo = {
      path: route.path,
      title: route.meta?.title || route.path,
      description: route.meta?.description || '',
      protected: route.protected || false,
      layout: route.layout ? 'VappLayout' : 'None',
      icon: getIcon(route.meta?.title || route.path),
    }

    // Categorize routes
    if (route.path === '/login') {
      groups.auth.push(routeInfo)
    } else if (route.path.startsWith('/events/:eventId/vapp')) {
      groups.vapp.push(routeInfo)
    } else if (route.path.startsWith('/events/:eventId')) {
      groups.main.push(routeInfo)
    } else if (route.path.startsWith('/events')) {
      groups.main.push(routeInfo)
    } else if (route.path.includes('debug') || route.path.includes('demo') || route.path.includes('test')) {
      groups.dev.push(routeInfo)
    } else if (!route.protected) {
      groups.public.push(routeInfo)
    } else {
      groups.main.push(routeInfo)
    }
  })

  return groups
}

export default function PagesIndex() {
  const groupedRoutes = groupRoutes(routes)

  const renderRouteCard = (route) => {
    const Icon = route.icon
    const examplePath = route.path.includes(':eventId') 
      ? route.path.replace(':eventId', '123') 
      : route.path

    return (
      <Card key={route.path} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">{route.title}</CardTitle>
                <CardDescription className="mt-1">
                  {route.description || 'No description'}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={route.protected ? 'default' : 'outline'}>
                {route.protected ? (
                  <>
                    <Shield className="h-3 w-3 mr-1" />
                    Protected
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3 mr-1" />
                    Public
                  </>
                )}
              </Badge>
              {route.layout !== 'None' && (
                <Badge variant="secondary">
                  {route.layout}
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Path:</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                {route.path}
              </code>
            </div>

            {route.path.includes(':eventId') && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Example:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                  {examplePath}
                </code>
              </div>
            )}

            <Link
              to={examplePath}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Open Page →
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Pages Index</h1>
          <p className="text-muted-foreground">
            Complete list of all available pages in the application
          </p>
        </div>

        {/* Main Pages */}
        {groupedRoutes.main.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6" />
              Main Pages
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupedRoutes.main.map(renderRouteCard)}
            </div>
          </div>
        )}

        {/* VAPP Pages */}
        {groupedRoutes.vapp.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-6 w-6" />
              VAPP Pages
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupedRoutes.vapp.map(renderRouteCard)}
            </div>
          </div>
        )}

        {/* Auth Pages */}
        {groupedRoutes.auth.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6" />
              Authentication
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupedRoutes.auth.map(renderRouteCard)}
            </div>
          </div>
        )}

        {/* Development/Testing Pages */}
        {groupedRoutes.dev.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TestTube className="h-6 w-6" />
              Development & Testing
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupedRoutes.dev.map(renderRouteCard)}
            </div>
          </div>
        )}

        {/* Public Pages */}
        {groupedRoutes.public.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Unlock className="h-6 w-6" />
              Public Pages
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupedRoutes.public.map(renderRouteCard)}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{groupedRoutes.main.length}</div>
                <div className="text-sm text-muted-foreground">Main Pages</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{groupedRoutes.vapp.length}</div>
                <div className="text-sm text-muted-foreground">VAPP Pages</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{groupedRoutes.dev.length}</div>
                <div className="text-sm text-muted-foreground">Dev Pages</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{routes.filter(r => !r.redirect).length}</div>
                <div className="text-sm text-muted-foreground">Total Routes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
