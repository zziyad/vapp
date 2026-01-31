import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Clock, Save, AlertCircle, FileText } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * Event Settings Component
 * Allows admins to configure event-specific VAPP settings
 */
export function EventSettings({ eventId }) {
  const { client } = useTransport()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deadlineHours, setDeadlineHours] = useState('')
  const [termsText, setTermsText] = useState('')
  const [termsVersion, setTermsVersion] = useState('v1.0')

  const eventAggregate = useMemo(() => {
    if (!client || !eventId) return null
    return getEventAggregate(eventId, client)
  }, [client, eventId])

  // Load event settings
  useEffect(() => {
    if (!eventAggregate?.events || !eventId) return

    const loadEvent = async () => {
      try {
        setLoading(true)
        setError('')
        await eventAggregate.events.detail(eventId)
      } catch (err) {
        console.error('Failed to load event:', err)
        setError(err.message || 'Failed to load event settings')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()

    const unsubscribe = eventAggregate.events.subscribe((state) => {
      if (state.detail) {
        console.log('EventSettings: State updated via subscription', { 
          detail: state.detail,
          settings: state.detail?.settings,
          deadlineHours: state.detail?.settings?.vapp?.request_edit_deadline_hours
        })
        setEvent(state.detail)
        // Initialize deadline hours from event settings
        const currentDeadline = state.detail?.settings?.vapp?.request_edit_deadline_hours
        if (currentDeadline !== undefined) {
          setDeadlineHours(String(currentDeadline))
        } else {
          setDeadlineHours('24') // Default value
        }
        
        // Initialize terms text from event settings
        const currentTermsText = state.detail?.settings?.vapp?.terms_text || ''
        const currentTermsVersion = state.detail?.settings?.vapp?.terms_version || 'v1.0'
        setTermsText(currentTermsText)
        setTermsVersion(currentTermsVersion)
      }
    })

    return unsubscribe
  }, [eventAggregate, eventId])

  const handleSave = useCallback(async () => {
    if (!eventAggregate?.events || !eventId) {
      toast.error('Event aggregate not ready')
      return
    }

    // Validate deadline hours
    const hours = parseInt(deadlineHours, 10)
    if (isNaN(hours) || hours < 0) {
      toast.error('Deadline hours must be a positive number')
      return
    }

    if (hours > 168) { // 7 days max
      toast.error('Deadline cannot exceed 168 hours (7 days)')
      return
    }

    try {
      setSaving(true)
      setError('')

      // Get current settings or initialize empty object
      const currentSettings = event?.settings || {}
      const currentVappSettings = currentSettings.vapp || {}

      // Update the deadline hours and terms
      const updatedSettings = {
        ...currentSettings,
        vapp: {
          ...currentVappSettings,
          request_edit_deadline_hours: hours,
          terms_text: termsText.trim(),
          terms_version: termsVersion.trim() || 'v1.0',
        },
      }

      console.log('EventSettings: Saving settings', { 
        eventId, 
        updatedSettings, 
        deadlineHours: hours,
        termsText: termsText.trim(),
        termsVersion: termsVersion.trim() || 'v1.0',
        vappSettings: updatedSettings.vapp
      })

      // Update event with new settings
      const updated = await eventAggregate.events.update({
        id: eventId,
        data: {
          settings: updatedSettings,
        },
      })

      console.log('EventSettings: Update response', { 
        updated, 
        settings: updated?.settings,
        vappSettings: updated?.settings?.vapp,
        deadlineHours: updated?.settings?.vapp?.request_edit_deadline_hours,
        termsText: updated?.settings?.vapp?.terms_text,
        termsVersion: updated?.settings?.vapp?.terms_version
      })

      // Force update the state immediately with the returned event
      if (updated) {
        console.log('EventSettings: Manually setting detail state with updated event', {
          updatedSettings: updated.settings,
          deadlineHours: updated?.settings?.vapp?.request_edit_deadline_hours
        })
        // Update the aggregate state
        eventAggregate.events.setDetail(updated)
        // Also update local state immediately to ensure UI updates
        setEvent(updated)
        const newDeadline = updated?.settings?.vapp?.request_edit_deadline_hours
        if (newDeadline !== undefined) {
          console.log('EventSettings: Updating deadlineHours input to', newDeadline)
          setDeadlineHours(String(newDeadline))
        }
      }

      // Also reload event to ensure we have the latest data from DB
      // This will trigger the subscription and update the UI
      const reloaded = await eventAggregate.events.detail(eventId)
      console.log('EventSettings: Event reloaded after save', { 
        reloaded,
        settings: reloaded?.settings,
        vappSettings: reloaded?.settings?.vapp,
        deadlineHours: reloaded?.settings?.vapp?.request_edit_deadline_hours,
        termsText: reloaded?.settings?.vapp?.terms_text,
        termsVersion: reloaded?.settings?.vapp?.terms_version
      })
      
      // Ensure UI is updated with reloaded data
      if (reloaded) {
        setEvent(reloaded)
        const reloadedDeadline = reloaded?.settings?.vapp?.request_edit_deadline_hours
        if (reloadedDeadline !== undefined) {
          setDeadlineHours(String(reloadedDeadline))
        }
        // Update terms text and version from reloaded event
        const reloadedTermsText = reloaded?.settings?.vapp?.terms_text || ''
        const reloadedTermsVersion = reloaded?.settings?.vapp?.terms_version || 'v1.0'
        setTermsText(reloadedTermsText)
        setTermsVersion(reloadedTermsVersion)
      }

      toast.success('Settings saved successfully')
    } catch (err) {
      console.error('Failed to save settings:', err)
      const errorMessage = err.message || 'Failed to save settings'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }, [eventAggregate, eventId, deadlineHours, termsText, termsVersion, event])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading settings...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Request Edit Deadline
          </CardTitle>
          <CardDescription>
            Configure how long requesters can edit submitted requests after submission.
            This allows requesters to make corrections within a specified time window.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="deadline-hours">
              Edit Deadline (Hours)
            </Label>
            <Input
              id="deadline-hours"
              type="number"
              min="0"
              max="168"
              value={deadlineHours}
              onChange={(e) => setDeadlineHours(e.target.value)}
              placeholder="24"
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">
              Enter the number of hours after submission during which requesters can edit their requests.
              Set to 0 to disable editing of submitted requests. Maximum: 168 hours (7 days).
            </p>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving || !deadlineHours}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          {event?.settings?.vapp?.request_edit_deadline_hours !== undefined && (
            <div className="mt-4 p-3 bg-muted rounded-md text-sm">
              <div className="font-medium mb-1">Current Configuration:</div>
              <div className="text-muted-foreground">
                Requesters can edit submitted requests for{' '}
                <strong>{event.settings.vapp.request_edit_deadline_hours}</strong> hours after submission.
                {event.settings.vapp.request_edit_deadline_hours === 0 && (
                  <span className="block mt-1 text-amber-600 dark:text-amber-400">
                    (Editing disabled)
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Terms & Conditions
          </CardTitle>
          <CardDescription>
            Configure the terms and conditions text that requesters must accept before their permits become active.
            This text will be displayed when requesters accept terms for their permits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="terms-version">
              Terms Version
            </Label>
            <Input
              id="terms-version"
              type="text"
              value={termsVersion}
              onChange={(e) => setTermsVersion(e.target.value)}
              placeholder="v1.0"
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">
              Version identifier for tracking terms changes (e.g., "v1.0", "v2.0").
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms-text">
              Terms & Conditions Text
            </Label>
            <Textarea
              id="terms-text"
              rows={12}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              placeholder="Enter terms and conditions text here..."
              disabled={saving}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              This text will be displayed to requesters when they need to accept terms for their permits.
              Use plain text or markdown-style formatting.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          {event?.settings?.vapp?.terms_text && (
            <div className="mt-4 p-3 bg-muted rounded-md text-sm">
              <div className="font-medium mb-1">Current Terms:</div>
              <div className="text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                {event.settings.vapp.terms_text}
              </div>
              {event.settings.vapp.terms_version && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Version: {event.settings.vapp.terms_version}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
