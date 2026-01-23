import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Session Information</CardTitle>
            <CardDescription>Your current authentication session details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="text-lg font-semibold">{user?.id || 'N/A'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-lg font-semibold">{user?.email || 'N/A'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="text-lg font-semibold">{user?.username || 'N/A'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-lg font-semibold">
                    {user?.first_name} {user?.last_name}
                  </p>
                </div>

                {user?.phone_number && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-lg font-semibold">{user.phone_number}</p>
                  </div>
                )}

                {user?.employee_id && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                    <p className="text-lg font-semibold">{user.employee_id}</p>
                  </div>
                )}
              </div>

              {user?.roles && user.roles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm"
                      >
                        {typeof role === 'object' ? role.display_name || role.name : role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user?.permissions && user.permissions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {user.permissions.map((permission, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user?.department && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="font-semibold">
                      {user.department.display_name || user.department.name || 'N/A'}
                    </p>
                    {user.department.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.department.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {user?.department_role && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Department Role</p>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="font-semibold">
                      {user.department_role.display_name || user.department_role.name || 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Complete Session Data (JSON)
                </p>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
