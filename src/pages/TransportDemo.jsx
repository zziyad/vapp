/**
 * Transport Demo Page
 * 
 * Demonstrates HTTP and WebSocket transport usage.
 */

import { useState, useEffect } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TransportDemo() {
  const { client, wsConnected, httpConnected, status } = useTransport()
  const [httpResult, setHttpResult] = useState(null)
  const [wsResult, setWsResult] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  // Listen for server events (WebSocket only)
  useEffect(() => {
    if (!client || !wsConnected) return

    const handleEvent = (data) => {
      const timestamp = new Date().toLocaleTimeString()
      setEvents((prev) => [
        { timestamp, data },
        ...prev.slice(0, 9), // Keep last 10 events
      ])
    }

    // Subscribe to all events (example)
    client.on('event-created', handleEvent)
    client.on('event-updated', handleEvent)

    return () => {
      client.off('event-created', handleEvent)
      client.off('event-updated', handleEvent)
    }
  }, [client, wsConnected])

  const testHttp = async () => {
    setLoading(true)
    setHttpResult(null)
    try {
      // Force HTTP by calling directly
      const result = await client.httpTransport.call('auth/me', {})
      setHttpResult(result)
    } catch (error) {
      setHttpResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testWebSocket = async () => {
    if (!wsConnected) {
      setWsResult({ error: 'WebSocket not connected' })
      return
    }

    setLoading(true)
    setWsResult(null)
    try {
      // Force WebSocket by calling directly
      const result = await client.wsTransport.call('auth/me', {})
      setWsResult(result)
    } catch (error) {
      setWsResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testApi = async () => {
    setLoading(true)
    try {
      // Use unified API (auto-selects transport)
      const result = await client.api.auth.me({})
      alert(`API call successful!\nTransport: ${wsConnected && client.preferWebSocket ? 'WebSocket' : 'HTTP'}`)
    } catch (error) {
      alert(`API call failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Transport System Demo</h1>
          <p className="text-muted-foreground mt-2">
            Test HTTP and WebSocket transports
          </p>
        </div>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Transport Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${httpConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>HTTP Transport: {httpConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>WebSocket Transport: {wsConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            {status && (
              <pre className="bg-muted p-2 rounded text-xs mt-4">
                {JSON.stringify(status, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* HTTP Test */}
        <Card>
          <CardHeader>
            <CardTitle>HTTP Transport</CardTitle>
            <CardDescription>Test direct HTTP calls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testHttp} disabled={loading || !httpConnected}>
              Test HTTP Call (auth/me)
            </Button>
            {httpResult && (
              <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                {JSON.stringify(httpResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* WebSocket Test */}
        <Card>
          <CardHeader>
            <CardTitle>WebSocket Transport</CardTitle>
            <CardDescription>Test direct WebSocket calls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testWebSocket} disabled={loading || !wsConnected}>
              Test WebSocket Call (auth/me)
            </Button>
            {!wsConnected && (
              <p className="text-sm text-yellow-600">
                ⚠️ WebSocket not connected. Connect first.
              </p>
            )}
            {wsResult && (
              <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                {JSON.stringify(wsResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Unified API Test */}
        <Card>
          <CardHeader>
            <CardTitle>Unified API</CardTitle>
            <CardDescription>Auto-selects transport (HTTP or WebSocket)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testApi} disabled={loading}>
              Test Unified API (client.api.auth.me)
            </Button>
          </CardContent>
        </Card>

        {/* Real-time Events */}
        <Card>
          <CardHeader>
            <CardTitle>Real-time Events (WebSocket Only)</CardTitle>
            <CardDescription>
              {wsConnected ? 'Listening for server events...' : 'WebSocket not connected'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events received yet</p>
            ) : (
              <div className="space-y-2">
                {events.map((event, i) => (
                  <div key={i} className="bg-muted p-3 rounded text-sm">
                    <div className="font-mono text-xs text-muted-foreground">{event.timestamp}</div>
                    <pre className="text-xs mt-1">{JSON.stringify(event.data, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
