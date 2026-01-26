import { Routes, Route, Navigate, Link } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import { routes } from './routes.config'

/**
 * Application Router Component
 * 
 * Automatically generates routes from the routes configuration.
 * Handles protected routes, redirects, and 404 pages.
 */
export default function AppRouter() {
  return (
    <Routes>
      {routes.map((route) => {
        // Handle redirects
        if (route.redirect) {
          return (
            <Route
              key={route.path}
              path={route.path}
              element={<Navigate to={route.redirect} replace />}
            />
          )
        }

        const Component = route.component
        const Layout = route.layout
        if (!Component) return null

        // Create element with optional layout wrapper
        let element = <Component />
        if (Layout) {
          element = <Layout>{element}</Layout>
        }

        // Handle protected routes
        if (route.protected) {
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoute>
                  {element}
                </ProtectedRoute>
              }
            />
          )
        }

        // Handle public routes
        return (
          <Route
            key={route.path}
            path={route.path}
            element={element}
          />
        )
      })}

      {/* 404 - Not Found */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-bold text-foreground">404</h1>
              <p className="text-xl text-muted-foreground">Page not found</p>
              <p className="text-sm text-muted-foreground">
                The page you're looking for doesn't exist.
              </p>
              <div className="flex gap-2 justify-center">
                <Link
                  to="/dashboard"
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to="/events"
                  className="inline-block px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                >
                  View Events
                </Link>
              </div>
            </div>
          </div>
        }
      />
    </Routes>
  )
}
