import { Routes, Route, Navigate } from 'react-router-dom'
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

        // Handle protected routes
        if (route.protected) {
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoute>
                  <route.component />
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
            element={<route.component />}
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
              <a
                href="/dashboard"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  )
}
