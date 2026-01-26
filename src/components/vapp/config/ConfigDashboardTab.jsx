"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useConfigReadiness } from '@/hooks/use-config-readiness'

/**
 * Config Dashboard Tab
 * Shows readiness status, checklist, blockers, and Continue Setup button
 */
export function ConfigDashboardTab({ eventId }) {
  const {
    loading,
    ready,
    completionPercent,
    checklistItems,
    blockers,
    firstIncompleteStep,
    refetch,
    readiness,
  } = useConfigReadiness(eventId)

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Event Configuration Status
                {ready ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    READY
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    NOT READY
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-2">
                {ready
                  ? 'Event is fully configured and ready for access requests'
                  : 'Complete the missing configuration items below'}
              </CardDescription>
            </div>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!ready && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completion</span>
                  <span className="text-sm text-gray-600">{completionPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${completionPercent}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{readiness?.sectors_count || 0}</div>
                <div className="text-xs text-gray-600">Sectors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{readiness?.functional_areas_count || 0}</div>
                <div className="text-xs text-gray-600">Functional Areas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{readiness?.vehicle_types_count || 0}</div>
                <div className="text-xs text-gray-600">Vehicle Types</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{readiness?.access_zones_count || 0}</div>
                <div className="text-xs text-gray-600">Access Zones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{readiness?.access_types_count || 0}</div>
                <div className="text-xs text-gray-600">Access Types</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{readiness?.validity_count || 0}</div>
                <div className="text-xs text-gray-600">Validity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{readiness?.importance_count || 0}</div>
                <div className="text-xs text-gray-600">Importance</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Checklist</CardTitle>
          <CardDescription>
            Required items must be completed for event readiness. Optional items are recommended.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(!checklistItems || checklistItems.length === 0) ? (
              <div className="text-center text-gray-500 py-4">No checklist items available</div>
            ) : (
              checklistItems.map((item) => {
                return (
                  <div
                    key={item.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      item.done 
                        ? 'bg-green-50 border-green-200' 
                        : item.required 
                        ? 'bg-white border-red-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : item.required ? (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    )}
                    <span
                      className={`flex-1 ${item.done ? 'text-gray-700' : item.required ? 'text-gray-900 font-medium' : 'text-blue-900'}`}
                    >
                      {item.label}
                    </span>
                    {item.required ? (
                      !item.done && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                        Optional
                      </Badge>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Blockers */}
      {blockers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Blockers
            </CardTitle>
            <CardDescription className="text-amber-700">
              These required items must be completed before the event can start
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {blockers.map((item) => (
                <li key={item.key || item.label} className="flex items-start gap-2 text-sm text-amber-800">
                  <XCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Continue Setup Button */}
      {!ready && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Continue Setup</h3>
                <p className="text-sm text-gray-600">
                  {firstIncompleteStep >= 0
                    ? `Continue from step ${firstIncompleteStep + 1} in the Setup Wizard`
                    : 'Start the Setup Wizard to configure your event'}
                </p>
              </div>
              <Button asChild>
                <Link to={`/events/${eventId}/vapp/admin/event`}>
                  Continue Setup
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ready to Start */}
      {ready && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Event is Ready!</h3>
                  <p className="text-sm text-green-700">
                    All configuration is complete. You can now start accepting access requests.
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to={`/events/${eventId}/vapp`}>
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
