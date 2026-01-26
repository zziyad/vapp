'use client'

import { useState, useEffect } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { vappConfigApi } from '@/lib/services/vapp/vapp-api-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Readiness Dashboard Component
 * Displays readiness checklist and allows recomputation
 */
export function ReadinessDashboard({ eventId }) {
  const { client } = useTransport()
  const [loading, setLoading] = useState(true)
  const [readiness, setReadiness] = useState(null)
  const [recomputing, setRecomputing] = useState(false)

  const loadReadiness = async () => {
    if (!client || !eventId) return

    try {
      setLoading(true)
      const call = (method, payload) => client.call(method, payload)
      const result = await vappConfigApi.readiness(call, eventId)
      
      if (result?.status === 'fulfilled' && result?.response) {
        setReadiness(result.response)
      } else {
        toast.error('Failed to load readiness status')
      }
    } catch (error) {
      console.error('Failed to load readiness:', error)
      toast.error('Failed to load readiness status')
    } finally {
      setLoading(false)
    }
  }

  const handleRecompute = async () => {
    if (!client || !eventId) return

    try {
      setRecomputing(true)
      // Call recompute API if it exists, otherwise just reload
      const call = (method, payload) => client.call(method, payload)
      const result = await vappConfigApi.readiness(call, eventId)
      
      if (result?.status === 'fulfilled') {
        toast.success('Readiness status updated')
        await loadReadiness()
      } else {
        toast.error('Failed to recompute readiness')
      }
    } catch (error) {
      console.error('Failed to recompute readiness:', error)
      toast.error('Failed to recompute readiness')
    } finally {
      setRecomputing(false)
    }
  }

  useEffect(() => {
    loadReadiness()
  }, [client, eventId])

  // Backend checklist items use `completed`; older frontend code used `complete`.
  // Normalize here so rendering stays consistent.
  const checklist = (readiness?.checklist || []).map((item) => ({
    ...item,
    complete: item?.complete ?? item?.completed ?? item?.done ?? false,
  }))
  const isReady = readiness?.isReady || readiness?.ready || false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Readiness Checklist</h1>
          <p className="text-sm text-gray-600 mt-1">
            Verify all required configuration is complete
          </p>
        </div>
        <Button 
          onClick={handleRecompute} 
          disabled={recomputing || !client}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${recomputing ? 'animate-spin' : ''}`} />
          Recompute Readiness
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={isReady ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isReady ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            Event Status: {isReady ? 'READY' : 'NOT READY'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isReady 
              ? 'All required configuration is complete. The event is ready for operations.'
              : 'Some required configuration is missing. Complete the checklist below.'}
          </p>
          {readiness?.completion_percentage !== undefined && (
            <div className="mt-2">
              <Badge variant={isReady ? 'default' : 'destructive'}>
                {readiness.completion_percentage}% Complete
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading checklist...
            </div>
          ) : checklist.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {readiness?.permitTypesCount > 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>Permit Types configured</span>
                </div>
                <Badge variant={readiness?.permitTypesCount > 0 ? 'default' : 'destructive'}>
                  {readiness?.permitTypesCount || 0} types
                </Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.complete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span>{item.title || item.label || item.name || item.step_key || `Item ${index + 1}`}</span>
                  </div>
                  <Badge variant={item.complete ? 'default' : 'destructive'}>
                    {item.complete ? 'Complete' : 'Incomplete'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blockers */}
      {readiness?.blockers && readiness.blockers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Blockers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {readiness.blockers.map((blocker, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="font-medium text-red-900">{blocker.message || blocker}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
