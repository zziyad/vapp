'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransport } from '@/contexts/TransportContext'
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'
import { getConfigAggregate } from '@/aggregates/config/get-config-aggregate'
import { toast } from 'sonner'
import { vappPermitApi } from '@/lib/services/vapp/vapp-api-service'
import { createVappTemplatePdf } from '@/lib/utils/simplePdf'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, FileDown, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Terms Acceptance Client Component
 * Displays permit details and terms for acceptance
 */
export function TermsAcceptanceClient({ eventId, permitId }) {
  const { client } = useTransport()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [permit, setPermit] = useState(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [event, setEvent] = useState(null)
  const [sectors, setSectors] = useState([])
  const [functionalAreas, setFunctionalAreas] = useState([])
  const [permitTypes, setPermitTypes] = useState([])

  // Load permit details
  const loadPermit = useCallback(async () => {
    if (!eventId || !permitId || !client) return

    setLoading(true)
    try {
      const call = (method, payload) => client.call(method, payload)
      
      // Load permit - use listForRequester to ensure ownership
      const permitResult = await vappPermitApi.listForRequester(call, eventId)
      
      // Find the specific permit
      const loadedPermit = permitResult?.status === 'fulfilled' && permitResult?.response?.permits
        ? permitResult.response.permits.find(p => p.id === permitId)
        : null

      if (loadedPermit) {
        setPermit(loadedPermit)

        // Check if terms have been sent - if not, redirect back
        const meta = loadedPermit.meta || {}
        const parsedMeta = typeof meta === 'string' ? (() => {
          try { return JSON.parse(meta); } catch { return {}; }
        })() : meta
        
        if (!parsedMeta?.terms_sent_at) {
          toast.error('Terms have not been sent yet. Please wait for terms to be sent before accepting.')
          navigate(`/events/${eventId}/vapp/requester/permits`)
          return
        }

        // Check if already accepted (will be handled in render)

        // Load event for terms text
        const eventAggregate = getEventAggregate(eventId, client)
        if (!eventAggregate?.events) {
          throw new Error('Event aggregate not available')
        }
        const eventDetail = await eventAggregate.events.detail(eventId)
        setEvent(eventDetail)

        // Load config for PDF generation
        const configAggregate = getConfigAggregate(eventId, client)
        const [sectorsList, functionalAreasList, permitTypesList] = await Promise.all([
          configAggregate.sector.list(eventId).catch(() => []),
          configAggregate.functionalArea.list(eventId).catch(() => []),
          configAggregate.permitType.list(eventId).catch(() => []),
        ])
        setSectors(Array.isArray(sectorsList) ? sectorsList : [])
        setFunctionalAreas(Array.isArray(functionalAreasList) ? functionalAreasList : [])
        setPermitTypes(Array.isArray(permitTypesList) ? permitTypesList : [])
      } else {
        toast.error('Permit not found')
        navigate(`/events/${eventId}/vapp/requester/permits`)
      }
    } catch (error) {
      console.error('Failed to load permit:', error)
      toast.error('Failed to load permit details')
    } finally {
      setLoading(false)
    }
  }, [eventId, permitId, client, navigate])

  useEffect(() => {
    loadPermit()
  }, [loadPermit])

  const handleAcceptTerms = async () => {
    if (!termsAccepted || !client) return

    setAccepting(true)
    try {
      const call = (method, payload) => client.call(method, payload)
      const result = await vappPermitApi.acceptTerms(call, eventId, permitId)

      if (result?.status === 'fulfilled') {
        toast.success('Terms accepted successfully! Your permit is now active.')
        navigate(`/events/${eventId}/vapp/requester/permits`)
      } else {
        throw new Error(result?.response?.message || 'Failed to accept terms')
      }
    } catch (error) {
      console.error('Failed to accept terms:', error)
      toast.error(error?.message || 'Failed to accept terms')
    } finally {
      setAccepting(false)
    }
  }

  const handleDownloadPermitPdf = async () => {
    if (!permit || !client) return

    try {
      const sourceRef = permit.request_id ? (() => {
        // Try to get source_ref from request if available
        // For now, use permit meta
        return permit.meta?.vehicle_info || {}
      })() : {}

      const meta = permit.meta || {}
      const parsedMeta = typeof meta === 'string' ? (() => {
        try { return JSON.parse(meta); } catch { return {}; }
      })() : meta

      const permitType = permitTypes.find(pt => pt.id === permit.permit_type_id)
      let vappType = permitType?.display_name || permitType?.name || permitType?.code || ""
      
      if (parsedMeta.subtype_code) {
        const subtypeCode = String(parsedMeta.subtype_code).trim()
        if (subtypeCode) {
          vappType = vappType ? `${vappType} (${subtypeCode})` : subtypeCode
        }
      }

      const serial = parsedMeta.serial_number || permit.id?.slice(0, 8) || ""
      const vehicleInfo = parsedMeta.vehicle_info || sourceRef || {}
      
      const sectorId = parsedMeta.sector_id || sourceRef.sector_id
      const functionalAreaId = parsedMeta.functional_area_id || sourceRef.functional_area_id
      const sector = sectors.find(s => s.id === sectorId)
      const functionalArea = functionalAreas.find(fa => fa.id === functionalAreaId)

      const rows = [{
        vappType,
        serial,
        driver: vehicleInfo.driver_name || "",
        plate: vehicleInfo.plate_number || permit.plate_number || "",
        company: vehicleInfo.company || "",
      }]

      const now = new Date()
      const pdfStr = createVappTemplatePdf({
        dateTime: now.toLocaleString(),
        sector: sector?.display_name || sector?.name || sector?.code || "",
        functionalArea: functionalArea?.display_name || functionalArea?.name || functionalArea?.code || "",
        rows,
      })

      const bytes = new Uint8Array(pdfStr.length)
      for (let i = 0; i < pdfStr.length; i++) bytes[i] = pdfStr.charCodeAt(i) & 0xff

      const blob = new Blob([bytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `VAPP_${serial}_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      
      toast.success("PDF downloaded successfully")
    } catch (error) {
      console.error("Failed to generate PDF:", error)
      toast.error(error?.message || "Failed to generate PDF")
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-muted-foreground mt-4">Loading permit details...</p>
      </div>
    )
  }

  if (!permit) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Permit not found</AlertDescription>
      </Alert>
    )
  }

  const meta = permit.meta || {}
  const parsedMeta = typeof meta === 'string' ? (() => {
    try { return JSON.parse(meta); } catch { return {}; }
  })() : meta

  const serialNumber = parsedMeta.serial_number || permit.id?.slice(0, 8)
  const termsText = event?.settings?.vapp?.terms_text || 'No terms and conditions available.'
  const termsVersion = event?.settings?.vapp?.terms_version || 'v1.0'

  // Check if already accepted
  if (parsedMeta.terms_accepted) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/events/${eventId}/vapp/requester/permits`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Permits
          </Link>
        </Button>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Terms have already been accepted for this permit on {new Date(parsedMeta.terms_accepted.accepted_at).toLocaleString()}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to={`/events/${eventId}/vapp/requester/permits`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Permits
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Permit Details */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Serial Number</Label>
              <p className="font-mono text-lg font-bold">{serialNumber}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Request ID</Label>
              <p className="font-mono text-sm">{permit.request_id?.slice(0, 8) || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Plate Number</Label>
              <p>{permit.plate_number || parsedMeta.vehicle_info?.plate_number || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Driver Name</Label>
              <p>{parsedMeta.vehicle_info?.driver_name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Company</Label>
              <p>{parsedMeta.vehicle_info?.company || 'N/A'}</p>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button onClick={handleDownloadPermitPdf} variant="outline" size="sm" className="flex-1">
                <FileDown className="h-4 w-4 mr-2" />
                Download Permit PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
            <CardDescription>Version {termsVersion}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[400px] overflow-y-auto border rounded-md p-4 bg-muted/50">
              <div className="whitespace-pre-wrap text-sm">{termsText}</div>
            </div>
            <Separator />
            <div className="flex items-start space-x-2">
              <Checkbox
                id="accept-terms"
                checked={termsAccepted}
                onCheckedChange={setTermsAccepted}
              />
              <Label htmlFor="accept-terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I have read and agree to the Terms & Conditions
              </Label>
            </div>
            <Button
              onClick={handleAcceptTerms}
              disabled={!termsAccepted || accepting}
              className="w-full"
              size="lg"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Terms
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
