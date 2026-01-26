import { useState, useEffect } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { getConfigAggregate } from '@/aggregates/config/get-config-aggregate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function GenerateSerialModal({
  eventId,
  permitTypeId,
  permitType,
  subtypeCode,
  subtypes,
  open,
  onOpenChange,
  onComplete,
}) {
  const { client } = useTransport()
  const aggregate = client ? getConfigAggregate(eventId, client) : null

  const [loading, setLoading] = useState(false)
  const [loadingNext, setLoadingNext] = useState(false)
  const [showPrefixConfirm, setShowPrefixConfirm] = useState(false)
  const [prefixMismatchInfo, setPrefixMismatchInfo] = useState(null)
  const [formData, setFormData] = useState({
    prefix: '',
    number_length: '6',
    starting_number: '',
    count: '100',
  })

  // Load next starting number when modal opens
  useEffect(() => {
    if (open && permitTypeId && aggregate?.serialNumber) {
      loadNextStarting()
    }
  }, [open, permitTypeId, subtypeCode, aggregate])

  const loadNextStarting = async () => {
    if (!aggregate?.serialNumber) return
    try {
      setLoadingNext(true)
      const result = await aggregate.serialNumber.getNextStarting(
        eventId,
        permitTypeId,
        subtypeCode || null
      )

      if (result?.next_starting_number) {
        setFormData(prev => ({
          ...prev,
          starting_number: String(result.next_starting_number),
          number_length: String(result.number_length || 6),
        }))
      }
    } catch (err) {
      console.error('Failed to load next starting number:', err)
      // Not an error - just means no serials exist yet
    } finally {
      setLoadingNext(false)
    }
  }

  const getPreviewSerial = (num) => {
    if (!formData.starting_number || !formData.number_length) return '—'
    const prefix = formData.prefix.trim() || '[Event Prefix]'
    const numberLength = parseInt(formData.number_length) || 6
    const numeric = parseInt(num) || 0
    const padded = String(numeric).padStart(numberLength, '0')
    return `${prefix}-${padded}`
  }

  const performGenerate = async (forceUpdatePrefix = false) => {
    if (!aggregate?.serialNumber) {
      throw new Error('Transport not ready')
    }

    const count = parseInt(formData.count)
    const startingNumber = parseInt(formData.starting_number)
    const numberLength = parseInt(formData.number_length)

    const result = await aggregate.serialNumber.generate({
      event_id: eventId,
      permit_type_id: permitTypeId,
      subtype_code: subtypeCode || null,
      prefix: formData.prefix.trim() || null, // null = use Event prefix
      number_length: numberLength,
      starting_number: startingNumber,
      count: count,
      force_update_prefix: forceUpdatePrefix,
    })

    // Handle response structure
    const response = result?.response || result
    const generated = response?.generated ?? count
    
    // Use actual response values if available, otherwise construct from form data
    let startSerial = response?.start_serial
    let endSerial = response?.end_serial
    
    if (!startSerial || !endSerial) {
      // Fallback: construct from form data
      const prefix = formData.prefix.trim() || '[Event Prefix]'
      const numberLength = parseInt(formData.number_length) || 6
      startSerial = `${prefix}-${String(startingNumber).padStart(numberLength, '0')}`
      endSerial = `${prefix}-${String(startingNumber + count - 1).padStart(numberLength, '0')}`
    }

    alert(
      `Generated ${generated} serial number${generated !== 1 ? 's' : ''} (${startSerial} to ${endSerial})`
    )
    onComplete()
  }

  const handleGenerate = async () => {
    if (!formData.starting_number) {
      alert('Starting number is required')
      return
    }

    const count = parseInt(formData.count)
    const startingNumber = parseInt(formData.starting_number)
    const numberLength = parseInt(formData.number_length)

    if (count < 1 || count > 10000) {
      alert('Count must be between 1 and 10000')
      return
    }

    if (startingNumber <= 0) {
      alert('Starting number must be greater than 0')
      return
    }

    if (numberLength < 1 || numberLength > 10) {
      alert('Number length must be between 1 and 10')
      return
    }

    try {
      setLoading(true)
      await performGenerate(false)
    } catch (err) {
      console.error('Failed to generate serial numbers:', err)
      
      // Check if it's a prefix mismatch error
      if (err?.code === 'CONFIG_SERIAL_NUMBER_PREFIX_MISMATCH' || err?.message?.includes('prefix')) {
        const meta = err?.response?.meta || err?.meta || {}
        setPrefixMismatchInfo({
          eventPrefix: meta.event_prefix,
          providedPrefix: meta.provided_prefix || formData.prefix.trim(),
        })
        setShowPrefixConfirm(true)
      } else {
        alert(err?.response?.message || err?.message || 'Failed to generate serial numbers')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPrefixChange = async () => {
    setShowPrefixConfirm(false)
    try {
      setLoading(true)
      await performGenerate(true) // Update event prefix
    } catch (err) {
      console.error('Failed to generate serial numbers:', err)
      alert(err?.response?.message || err?.message || 'Failed to generate serial numbers')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelPrefixChange = async () => {
    setShowPrefixConfirm(false)
    // Use existing prefix (clear the prefix field so it uses event prefix)
    try {
      setLoading(true)
      setFormData(prev => ({ ...prev, prefix: '' }))
      // Wait a tick for state to update
      await new Promise(resolve => setTimeout(resolve, 0))
      await performGenerate(false) // Use existing event prefix
    } catch (err) {
      console.error('Failed to generate serial numbers:', err)
      alert(err?.response?.message || err?.message || 'Failed to generate serial numbers')
    } finally {
      setLoading(false)
    }
  }

  const previewStart = getPreviewSerial(formData.starting_number)
  const previewEnd = formData.count
    ? getPreviewSerial((parseInt(formData.starting_number) || 0) + (parseInt(formData.count) || 0) - 1)
    : '—'

  const selectedSubtype = subtypes?.find(s => s.code === subtypeCode)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Serial Numbers</DialogTitle>
            <DialogDescription>
              Generate serial numbers for {permitType?.display_name}
              {selectedSubtype ? ` - ${selectedSubtype.display_name}` : ' (Base Type)'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Permit Type & Subtype (read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Permit Type</Label>
                <Input value={permitType?.display_name || ''} disabled />
              </div>
              <div>
                <Label>Subtype</Label>
                <Input
                  value={selectedSubtype ? `${selectedSubtype.code} - ${selectedSubtype.display_name}` : 'Base Type'}
                  disabled
                />
              </div>
            </div>

            {/* Prefix */}
            <div>
              <Label htmlFor="prefix">
                Prefix <span className="text-gray-500 text-xs">(optional)</span>
              </Label>
              <Input
                id="prefix"
                value={formData.prefix}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prefix: e.target.value.toUpperCase(),
                  })
                }
                placeholder="U23AC26 (leave empty to use Event prefix)"
                maxLength={50}
              />
              <p className="text-xs text-gray-600 mt-1">
                Serial prefix (e.g., U23AC26). Leave empty to use Event.serial_prefix or Event.code.
              </p>
            </div>

            {/* Number Length & Starting Number */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="number_length">
                  Number Length <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="number_length"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.number_length}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      number_length: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-gray-600 mt-1">Digits for numeric part (1-10)</p>
              </div>

              <div>
                <Label htmlFor="starting_number">
                  Starting Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="starting_number"
                  type="number"
                  min="1"
                  value={formData.starting_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      starting_number: e.target.value,
                    })
                  }
                  placeholder={loadingNext ? 'Loading...' : '201001'}
                  disabled={loadingNext}
                />
                <p className="text-xs text-gray-600 mt-1">
                  {loadingNext
                    ? 'Loading next number...'
                    : 'Auto-filled if serials exist, or enter manually'}
                </p>
              </div>
            </div>

            {/* Count */}
            <div>
              <Label htmlFor="count">
                Count <span className="text-red-500">*</span>
              </Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="10000"
                value={formData.count}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    count: e.target.value,
                  })
                }
              />
              <p className="text-xs text-gray-600 mt-1">How many serial numbers to generate (1-10000)</p>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="mt-2 space-y-1">
                <div className="text-sm">
                  <span className="text-gray-600">Will generate:</span>{' '}
                  <span className="font-mono font-semibold">{previewStart}</span>
                  {' to '}
                  <span className="font-mono font-semibold">{previewEnd}</span>
                </div>
                {formData.count && parseInt(formData.count) > 0 && (
                  <div className="text-xs text-gray-500">
                    Total: {formData.count} serial number{parseInt(formData.count) !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading || loadingNext}>
              {loading ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prefix Change Confirmation Dialog */}
      <AlertDialog open={showPrefixConfirm} onOpenChange={setShowPrefixConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Prefix Mismatch</AlertDialogTitle>
            <AlertDialogDescription>
              The prefix you entered ({prefixMismatchInfo?.providedPrefix}) differs from the event's saved prefix ({prefixMismatchInfo?.eventPrefix}).
              <br /><br />
              Do you want to update the event prefix to {prefixMismatchInfo?.providedPrefix}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelPrefixChange}>
              No, use existing prefix
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPrefixChange}>
              Yes, update prefix
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
