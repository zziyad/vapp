'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell } from 'lucide-react'

/**
 * Notifications List Component
 * Placeholder for notifications/messages functionality
 */
export function NotificationsList({ eventId }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-600 mt-1">
          View notifications and messages about your requests
        </p>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Notifications functionality coming soon. You will receive notifications about:
            <ul className="list-disc list-inside mt-4 text-left max-w-md mx-auto space-y-2">
              <li>Request status changes</li>
              <li>Reviewer feedback</li>
              <li>Approval/rejection notifications</li>
              <li>Permit generation updates</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
