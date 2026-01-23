import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTransport } from '@/contexts/TransportContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function DebugAuth() {
  const { user, isAuthenticated, isLoading, login, logout, refreshTokens } = useAuth()
  const { client } = useTransport()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [logs, setLogs] = useState([])

  const addLog = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, data }])
    console.log(`[DebugAuth] ${message}`, data || '')
  }

  const testLogin = async () => {
    addLog('Starting login test...')
    addLog('Cookies before login', document.cookie)
    
    const success = await login(email, password)
    
    addLog('Login result', success)
    addLog('Cookies after login', document.cookie)
    addLog('User state', user)
    addLog('isAuthenticated', isAuthenticated)
  }

  const testRefresh = async () => {
    addLog('Starting refresh test...')
    addLog('Cookies before refresh (document.cookie)', document.cookie || '(empty)')
    addLog('⚠️ Note: HttpOnly cookies won\'t show in document.cookie')
    addLog('Check Network tab for Set-Cookie headers!')
    
    const success = await refreshTokens()
    
    addLog('Refresh result', success)
    addLog('Cookies after refresh (document.cookie)', document.cookie || '(empty)')
    addLog('User state', user)
    
    // Wait a bit and test if cookies work
    setTimeout(async () => {
      addLog('Testing if cookies work after refresh...')
      try {
        const meResult = await client.api.auth.me({})
        addLog('auth/me after refresh: SUCCESS', meResult)
      } catch (error) {
        addLog('auth/me after refresh: FAILED', error.message)
        addLog('This means cookies are not being sent!')
      }
    }, 500)
  }

  const testMeEndpoint = async () => {
    addLog('Testing auth/me endpoint...')
    addLog('Current cookies', document.cookie)
    
    try {
      const result = await client.api.auth.me({})
      addLog('auth/me result', result)
    } catch (error) {
      addLog('auth/me error', error.message)
    }
  }

  const clearLogs = () => setLogs([])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Auth Debug Panel</h1>
          <p className="text-muted-foreground mt-2">Debug authentication flow</p>
        </div>

        {/* Current State */}
        <Card>
          <CardHeader>
            <CardTitle>Current Auth State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>isAuthenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
              </div>
              <div>
                <strong>isLoading:</strong> {isLoading ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>User:</strong> {user ? `${user.email} (ID: ${user.id})` : 'null'}
              </div>
              <div className="col-span-2">
                <strong>Cookies (document.cookie):</strong> {document.cookie || '(empty - HttpOnly cookies hidden)'}
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">
                ⚠️ HttpOnly cookies (auth-token, refresh-token) won't show here. Check Network tab → Response Headers → Set-Cookie
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={testLogin}>Login</Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Tests</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={testRefresh} variant="secondary">
              Test Refresh
            </Button>
            <Button onClick={testMeEndpoint} variant="secondary">
              Test /auth/me
            </Button>
            <Button onClick={logout} variant="destructive">
              Logout
            </Button>
            <Button onClick={clearLogs} variant="outline">
              Clear Logs
            </Button>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md space-y-2 max-h-96 overflow-auto font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No logs yet...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="border-b border-border pb-2">
                    <div className="text-muted-foreground">[{log.timestamp}]</div>
                    <div className="font-semibold">{log.message}</div>
                    {log.data && (
                      <pre className="mt-1 text-xs overflow-auto">
                        {typeof log.data === 'object' 
                          ? JSON.stringify(log.data, null, 2)
                          : String(log.data)
                        }
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Browser Console */}
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Important</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Also check the browser console (F12) for detailed transport logs including:
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>[HttpTransport] logs - request/response details</li>
              <li>[AuthContext] logs - auth flow</li>
              <li>Cookie information</li>
              <li>Network tab - check Set-Cookie headers</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
