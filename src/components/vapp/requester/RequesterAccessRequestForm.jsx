'use client'

import { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useTransport } from '@/contexts/TransportContext'
import { useAuth } from '@/contexts/AuthContext'
import { isSuperAdmin, hasRole } from '@/lib/permissions'
import { isValidUUID } from '@/lib/utils/uuid'
import { getConfigAggregate } from '@/aggregates/config/get-config-aggregate'
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'

import { vappAccessRequestApi } from '@/lib/services/vapp/vapp-api-service'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock } from 'lucide-react'

const MemoSelectField = memo(function MemoSelectField({
  label,
  value,
  onValueChange,
  disabled,
  placeholder,
  options,
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{options}</SelectContent>
      </Select>
    </div>
  )
})

const MemoTextField = memo(function MemoTextField({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
  placeholder,
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={onChange} disabled={disabled} type={type} placeholder={placeholder} />
    </div>
  )
})

const MemoTextareaField = memo(function MemoTextareaField({
  label,
  value,
  onChange,
  disabled,
  rows = 4,
  placeholder,
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea rows={rows} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} />
    </div>
  )
})

const MemoVehiclesSection = memo(function MemoVehiclesSection({
  vehicles,
  setVehicles,
  vehicleTypeOptions,
  accessZoneOptions,
  accessTypeOptions,
  validityOptions,
  importanceOptions,
  isEditable,
  saving,
  savingDraft,
  mode,
  request,
}) {
  const canEdit = isEditable && !saving && !savingDraft

  const handleAddVehicle = useCallback(() => {
    setVehicles((prev) => [...prev, { 
      vehicleTypeId: '', 
      plateNumber: '', 
      driverName: '', 
      driverPhone: '',
      company: '',
      accessZoneId: '',
      accessTypeId: '',
      validityId: '',
      importanceId: '',
      justification: '',
    }])
  }, [setVehicles])

  const handleRemoveVehicle = useCallback(
    (idx) => {
      setVehicles((prev) => prev.filter((_, i) => i !== idx))
    },
    [setVehicles],
  )

  const updateVehicle = useCallback(
    (idx, patch) => {
      setVehicles((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)))
    },
    [setVehicles],
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Vehicles *</Label>
        {/* Hide "Add Vehicle" button when editing a submitted request */}
        {!(mode === 'edit' && request?.status === 'submitted') && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canEdit}
            onClick={handleAddVehicle}
          >
            + Add Vehicle
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {vehicles.map((v, idx) => (
          <div key={`vehicle-${idx}`} className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">Vehicle {idx + 1}</div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!isEditable || vehicles.length <= 1 || saving || savingDraft}
                onClick={() => handleRemoveVehicle(idx)}
              >
                Remove
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Type *</Label>
                <Select
                  value={v.vehicleTypeId}
                  disabled={!isEditable}
                  onValueChange={(val) => updateVehicle(idx, { vehicleTypeId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>{vehicleTypeOptions}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>License Plate Number *</Label>
                <Input
                  value={v.plateNumber}
                  disabled={!isEditable}
                  placeholder="ABC1234"
                  onChange={(e) => updateVehicle(idx, { plateNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Driver Name *</Label>
                <Input
                  value={v.driverName}
                  disabled={!isEditable}
                  onChange={(e) => updateVehicle(idx, { driverName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Driver Phone *</Label>
                <Input
                  value={v.driverPhone}
                  disabled={!isEditable}
                  onChange={(e) => updateVehicle(idx, { driverPhone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={v.company || ''}
                  disabled={!isEditable}
                  placeholder="Company name"
                  onChange={(e) => updateVehicle(idx, { company: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Venue (Access Zone) *</Label>
                <Select
                  value={v.accessZoneId}
                  disabled={!isEditable}
                  onValueChange={(val) => updateVehicle(idx, { accessZoneId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select access zone" />
                  </SelectTrigger>
                  <SelectContent>{accessZoneOptions}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Access / Parking Type *</Label>
                <Select
                  value={v.accessTypeId}
                  disabled={!isEditable}
                  onValueChange={(val) => updateVehicle(idx, { accessTypeId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select access type" />
                  </SelectTrigger>
                  <SelectContent>{accessTypeOptions}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Validity *</Label>
                <Select
                  value={v.validityId}
                  disabled={!isEditable}
                  onValueChange={(val) => updateVehicle(idx, { validityId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select validity" />
                  </SelectTrigger>
                  <SelectContent>{validityOptions}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Importance *</Label>
                <Select
                  value={v.importanceId}
                  disabled={!isEditable}
                  onValueChange={(val) => updateVehicle(idx, { importanceId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select importance" />
                  </SelectTrigger>
                  <SelectContent>{importanceOptions}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Justification *</Label>
              <Textarea
                value={v.justification || ''}
                disabled={!isEditable}
                placeholder="Explain why this vehicle request is needed (min 10 chars)"
                rows={3}
                onChange={(e) => updateVehicle(idx, { justification: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        Multiple vehicles will be submitted as multiple separate requests (no quantity field).
      </div>
    </div>
  )
})

/**
 * RequesterAccessRequestForm
 *
 * New requester-facing form (replaces old wizard items/vehicles UX).
 * Stores:
 * - header-ish fields in AccessRequest.source_ref
 * - vehicle fields in AccessRequestItem.input.external_vehicles
 *
 * Backend still requires 1 AccessRequestItem (permit_type_id NOT NULL),
 * so we silently pick the first accessible active PermitType for the event.
 */
export function RequesterAccessRequestForm({ eventId, requestId, mode = 'create', onDone }) {
  const navigate = useNavigate()
  const { client } = useTransport()
  const { user } = useAuth()

  const isAdmin = useMemo(() => isSuperAdmin(user) || hasRole(user, 'admin'), [user])

  // Stable defaults (avoid depending on live state in effects; prevents reloading on every keystroke in edit mode)
  const defaultVloName = useMemo(
    () => user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
    [user?.full_name, user?.first_name, user?.last_name],
  )
  const defaultVloContactPhone = useMemo(() => user?.phone || user?.mobile || '', [user?.phone, user?.mobile])
  const defaultVloEmail = useMemo(() => user?.email || '', [user?.email])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  // DB state (edit mode)
  const [request, setRequest] = useState(null)
  const [item, setItem] = useState(null)

  // Config lists (using aggregate pattern)
  const aggregate = useMemo(() => {
    if (!client || !isValidUUID(eventId)) return null
    return getConfigAggregate(eventId, client)
  }, [client, eventId])

  // Event aggregate for deadline check
  const eventAggregate = useMemo(() => {
    if (!client || !isValidUUID(eventId)) return null
    return getEventAggregate(eventId, client)
  }, [client, eventId])

  const [event, setEvent] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [sectors, setSectors] = useState([])
  const [functionalAreas, setFunctionalAreas] = useState([])
  const [accessZones, setAccessZones] = useState([])
  const [accessTypes, setAccessTypes] = useState([])
  const [validities, setValidities] = useState([])
  const [importances, setImportances] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])

  // Form state
  const [sectorId, setSectorId] = useState('')
  const [functionalAreaId, setFunctionalAreaId] = useState('')
  const [vloName, setVloName] = useState(defaultVloName)
  const [vloContactPhone, setVloContactPhone] = useState(defaultVloContactPhone)
  const [vloEmail, setVloEmail] = useState(defaultVloEmail)
  // Note: Company, Access Zone, Access Type, Validity, and Importance are now per-vehicle
  // Keeping these for backward compatibility when loading existing requests
  const [company, setCompany] = useState('')
  const [accessZoneId, setAccessZoneId] = useState('')
  const [accessTypeId, setAccessTypeId] = useState('')
  const [validityId, setValidityId] = useState('')
  const [importanceId, setImportanceId] = useState('')

  // Vehicles: v2 semantics => "multiple vehicles" means multiple requests (no quantity field).
  const [vehicles, setVehicles] = useState([
    { 
      vehicleTypeId: '', 
      plateNumber: '', 
      driverName: '', 
      driverPhone: '',
      company: '',
      accessZoneId: '',
      accessTypeId: '',
      validityId: '',
      importanceId: '',
    },
  ])
  const [justification, setJustification] = useState('')

  // Stable handlers so memoized field components don't re-render unnecessarily.
  const onChangeVloName = useCallback((e) => setVloName(e.target.value), [])
  const onChangeVloContactPhone = useCallback((e) => setVloContactPhone(e.target.value), [])
  const onChangeVloEmail = useCallback((e) => setVloEmail(e.target.value), [])
  const onChangeCompany = useCallback((e) => setCompany(e.target.value), [])
  const onChangeJustification = useCallback((e) => setJustification(e.target.value), [])

  // Load event for deadline check
  useEffect(() => {
    if (!eventAggregate?.events || !eventId) {
      console.log('RequesterAccessRequestForm: eventAggregate or eventId missing', { eventAggregate: !!eventAggregate, eventId })
      return
    }
    const loadEvent = async () => {
      try {
        console.log('RequesterAccessRequestForm: Loading event for deadline check', eventId)
        const result = await eventAggregate.events.detail(eventId)
        console.log('RequesterAccessRequestForm: Event loaded', { 
          hasSettings: !!result?.settings,
          deadlineHours: result?.settings?.vapp?.request_edit_deadline_hours 
        })
      } catch (err) {
        console.error('RequesterAccessRequestForm: Failed to load event:', err)
      }
    }
    loadEvent()
    const unsubscribe = eventAggregate.events.subscribe((state) => {
      if (state.detail) {
        console.log('RequesterAccessRequestForm: Event state updated', { 
          hasSettings: !!state.detail?.settings,
          deadlineHours: state.detail?.settings?.vapp?.request_edit_deadline_hours 
        })
        setEvent(state.detail)
      }
    })
    return unsubscribe
  }, [eventAggregate, eventId])

  // Update countdown timer every second for live countdown
  useEffect(() => {
    if (!request || !event || request.status !== 'submitted' || !request.submitted_at) {
      setTimeRemaining(null)
      return
    }

    const deadlineHours = event?.settings?.vapp?.request_edit_deadline_hours
    if (!deadlineHours || deadlineHours <= 0) {
      setTimeRemaining(null)
      return
    }

    const updateCountdown = () => {
      const submittedAt = new Date(request.submitted_at)
      const now = new Date()
      const deadlineMs = deadlineHours * 60 * 60 * 1000
      const timeSinceSubmission = now.getTime() - submittedAt.getTime()
      const remaining = deadlineMs - timeSinceSubmission
      setTimeRemaining(remaining > 0 ? remaining : 0)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000) // Update every second

    return () => clearInterval(interval)
  }, [request, event, request?.submitted_at, event?.settings?.vapp?.request_edit_deadline_hours])

  const isEditable = useMemo(() => {
    if (mode === 'create') return true
    const status = request?.status
    
    // Always editable: draft and need_info
    if (status === 'draft' || status === 'need_info') {
      return true
    }

    // Check deadline for submitted requests
    if (status === 'submitted' && request && event) {
      const deadlineHours = event?.settings?.vapp?.request_edit_deadline_hours
      if (!deadlineHours || deadlineHours <= 0) {
        return false
      }

      if (!request.submitted_at) {
        return false
      }

      const submittedAt = new Date(request.submitted_at)
      const now = new Date()
      const deadlineMs = deadlineHours * 60 * 60 * 1000
      const timeSinceSubmission = now.getTime() - submittedAt.getTime()

      return timeSinceSubmission <= deadlineMs
    }

    return false
  }, [mode, request?.status, request?.submitted_at, request, event])

  // Memoize options lists to avoid rebuilding hundreds of <SelectItem/> nodes on every keystroke.
  const functionalAreaOptions = useMemo(
    () =>
      functionalAreas.map((fa) => (
        <SelectItem key={fa.id} value={fa.id}>
          {fa.display_name || fa.code}
        </SelectItem>
      )),
    [functionalAreas],
  )

  const sectorOptions = useMemo(
    () =>
      sectors.map((s) => (
        <SelectItem key={s.id} value={s.id}>
          {s.display_name || s.code}
        </SelectItem>
      )),
    [sectors],
  )

  const accessZoneOptions = useMemo(
    () =>
      accessZones.map((z) => (
        <SelectItem key={z.id} value={z.id}>
          {z.display_name || z.code}
        </SelectItem>
      )),
    [accessZones],
  )

  const accessTypeOptions = useMemo(
    () =>
      accessTypes.map((t) => (
        <SelectItem key={t.id} value={t.id}>
          {t.display_name || t.code}
        </SelectItem>
      )),
    [accessTypes],
  )

  const validityOptions = useMemo(
    () =>
      validities.map((v) => (
        <SelectItem key={v.id} value={v.id}>
          {v.display_name || v.code}
        </SelectItem>
      )),
    [validities],
  )

  const importanceOptions = useMemo(
    () =>
      importances.map((i) => (
        <SelectItem key={i.id} value={i.id}>
          {i.priority_order !== null && i.priority_order !== undefined
            ? `${i.priority_order} — ${i.display_name || i.code}`
            : i.display_name || i.code}
        </SelectItem>
      )),
    [importances],
  )

  const vehicleTypeOptions = useMemo(
    () =>
      vehicleTypes.map((vt) => (
        <SelectItem key={vt.id} value={vt.id}>
          {vt.display_name || vt.code}
        </SelectItem>
      )),
    [vehicleTypes],
  )

  // Load config using aggregate pattern
  const loadConfig = useCallback(async () => {
    if (!aggregate || !isValidUUID(eventId)) return

    try {
      setLoading(true)
      // Load all config entities in parallel using aggregate modules
      const [
        sectorsList,
        functionalAreasList,
        accessZonesList,
        accessTypesList,
        validitiesList,
        importancesList,
        vehicleTypesList,
      ] = await Promise.all([
        aggregate.sector.list(eventId).catch(() => []),
        aggregate.functionalArea.list(eventId).catch(() => []),
        aggregate.accessZone.list(eventId).catch(() => []),
        aggregate.accessType.list(eventId).catch(() => []),
        aggregate.validity.list(eventId).catch(() => []),
        aggregate.importance.list().catch(() => []),
        aggregate.vehicleType.list(eventId).catch(() => []),
      ])

      setSectors(Array.isArray(sectorsList) ? sectorsList.filter(x => x?.is_active !== false) : [])
      setFunctionalAreas(Array.isArray(functionalAreasList) ? functionalAreasList.filter(x => x?.is_active !== false) : [])
      setAccessZones(Array.isArray(accessZonesList) ? accessZonesList.filter(x => x?.is_active !== false) : [])
      setAccessTypes(Array.isArray(accessTypesList) ? accessTypesList.filter(x => x?.is_active !== false) : [])
      setValidities(Array.isArray(validitiesList) ? validitiesList.filter(x => x?.is_active !== false) : [])

      const imp = Array.isArray(importancesList) ? importancesList : []
      setImportances(
        imp
          .filter((x) => x?.is_active !== false)
          .sort((a, b) => (a?.priority_order ?? 9999) - (b?.priority_order ?? 9999))
      )

      const vts = Array.isArray(vehicleTypesList) ? vehicleTypesList : []
      setVehicleTypes(vts.filter((x) => x?.is_active !== false))
    } catch (err) {
      console.error('RequesterAccessRequestForm: failed to load config', err)
      toast.error(err?.message || 'Failed to load request configuration')
    } finally {
      setLoading(false)
    }
  }, [aggregate, eventId])

  const loadExisting = useCallback(async () => {
    if (mode !== 'edit') return
    if (!requestId || !isValidUUID(requestId) || !client) return

    try {
      setLoading(true)
      const call = (method, payload) => client.call(method, payload)
      const reqRes = await vappAccessRequestApi.get(call, eventId, requestId)
      if (reqRes?.status !== 'fulfilled') {
        throw new Error(reqRes?.response?.message || reqRes?.response || 'Failed to load request')
      }

      const req = reqRes.response?.request || reqRes.response
      setRequest(req)
      setJustification(req?.justification || '')

      const src = req?.source_ref && typeof req.source_ref === 'object' ? req.source_ref : {}
      setSectorId(src?.sector_id || '')
      setFunctionalAreaId(src?.functional_area_id || '')
      setVloName(src?.vlo_name || defaultVloName)
      setVloContactPhone(src?.vlo_contact_phone || defaultVloContactPhone)
      setVloEmail(src?.vlo_email || defaultVloEmail)
      setCompany(src?.company || '')
      setAccessZoneId(src?.access_zone_id || '')
      setAccessTypeId(src?.access_type_id || '')
      setValidityId(src?.validity_id || '')
      setImportanceId(src?.importance_id || '')

      const itemsRes = await vappAccessRequestApi.item.list(call, eventId, requestId, { v2: true })
      if (itemsRes?.status === 'fulfilled') {
        const items = itemsRes.response?.items || itemsRes.response || []
        const first = items[0] || null
        setItem(first)

        const input = first?.input && typeof first.input === 'object' ? first.input : {}
        const loadedVehicleTypeId = input?.vehicle_type_id || ''
        const ev = Array.isArray(input?.external_vehicles) ? input.external_vehicles[0] : null
        const loaded = {
          vehicleTypeId: loadedVehicleTypeId,
          plateNumber: ev?.plate_number || '',
          driverName: ev?.driver_name || '',
          driverPhone: ev?.driver_mobile || '',
        }

        // If request.source_ref contains multi-vehicle draft data, prefer it.
        const srcVehicles = Array.isArray(src?.vehicles) ? src.vehicles : null
        if (srcVehicles && srcVehicles.length > 0) {
          setVehicles(
            srcVehicles.map((v) => ({
              vehicleTypeId: v?.vehicle_type_id || '',
              plateNumber: v?.plate_number || '',
              driverName: v?.driver_name || '',
              driverPhone: v?.driver_phone || '',
              company: v?.company || '',
              accessZoneId: v?.access_zone_id || '',
              accessTypeId: v?.access_type_id || '',
              validityId: v?.validity_id || '',
              importanceId: v?.importance_id || '',
              justification: v?.justification || '',
            }))
          )
        } else {
          // For single vehicle, try to load from source_ref top-level fields as fallback
          setVehicles([{
            ...loaded,
            company: src?.company || '',
            accessZoneId: src?.access_zone_id || '',
            accessTypeId: src?.access_type_id || '',
            validityId: src?.validity_id || '',
            importanceId: src?.importance_id || '',
            justification: src?.justification || req?.justification || '',
          }])
        }
      }
    } catch (err) {
      console.error('RequesterAccessRequestForm: failed to load existing request', err)
      toast.error(err?.message || 'Failed to load request')
    } finally {
      setLoading(false)
    }
  }, [
    mode,
    requestId,
    client,
    eventId,
    defaultVloName,
    defaultVloContactPhone,
    defaultVloEmail,
  ])

  useEffect(() => {
    if (!eventId) return
    loadConfig()
  }, [eventId, loadConfig])

  useEffect(() => {
    loadExisting()
  }, [loadExisting])

  const validate = () => {
    if (!vloName.trim()) {
      toast.error('VLO Name is required')
      return false
    }
    if (!vloContactPhone.trim()) {
      toast.error('VLO Contact Phone is required')
      return false
    }
    if (!vloEmail.trim()) {
      toast.error('VLO Email is required')
      return false
    }
    if (!sectorId) {
      toast.error('Sector is required')
      return false
    }
    if (!functionalAreaId) {
      toast.error('Functional Area is required')
      return false
    }
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      toast.error('At least 1 vehicle is required')
      return false
    }
    for (let idx = 0; idx < vehicles.length; idx++) {
      const v = vehicles[idx]
      const n = idx + 1
      if (!v?.vehicleTypeId) {
        toast.error(`Vehicle ${n}: Vehicle type is required`)
        return false
      }
      if (!v?.plateNumber?.trim()) {
        toast.error(`Vehicle ${n}: License plate number is required`)
        return false
      }
      if (!v?.driverName?.trim()) {
        toast.error(`Vehicle ${n}: Driver name is required`)
        return false
      }
      if (!v?.driverPhone?.trim()) {
        toast.error(`Vehicle ${n}: Driver phone is required`)
        return false
      }
      // Company is optional, no validation needed
      if (!v?.accessZoneId) {
        toast.error(`Vehicle ${n}: Venue (Access Zone) is required`)
        return false
      }
      if (!v?.accessTypeId) {
        toast.error(`Vehicle ${n}: Access / Parking Type is required`)
        return false
      }
      if (!v?.validityId) {
        toast.error(`Vehicle ${n}: Validity is required`)
        return false
      }
      if (!v?.importanceId) {
        toast.error(`Vehicle ${n}: Importance is required`)
        return false
      }
      if (!v?.justification?.trim() || v.justification.trim().length < 10) {
        toast.error(`Vehicle ${n}: Justification is required (min 10 characters)`)
        return false
      }
    }
    return true
  }

  const buildDraftSourceRef = () => {
    // For drafts, use first vehicle's values if available
    const firstVehicle = vehicles?.[0]
    return {
      vapp_version: 2,
      sector_id: sectorId || null,
      functional_area_id: functionalAreaId || null,
      vlo_name: vloName?.trim() || null,
      vlo_contact_phone: vloContactPhone?.trim() || null,
      vlo_email: vloEmail?.trim() || null,
      // Use first vehicle's values for backward compatibility
      company: firstVehicle?.company?.trim() || null,
      access_zone_id: firstVehicle?.accessZoneId || null,
      access_type_id: firstVehicle?.accessTypeId || null,
      validity_id: firstVehicle?.validityId || null,
      importance_id: firstVehicle?.importanceId || null,
      vehicles: vehicles.map((v) => ({
        vehicle_type_id: v?.vehicleTypeId || null,
        plate_number: v?.plateNumber ? v.plateNumber.toUpperCase().trim().replace(/\s+/g, '') : null,
        driver_name: v?.driverName?.trim() || null,
        driver_phone: v?.driverPhone?.trim() || null,
        company: v?.company?.trim() || null,
        access_zone_id: v?.accessZoneId || null,
        access_type_id: v?.accessTypeId || null,
        validity_id: v?.validityId || null,
        importance_id: v?.importanceId || null,
        justification: v?.justification?.trim() || null,
      })),
      // Backward-compatible single-vehicle keys (first vehicle)
      vehicle_type_id: firstVehicle?.vehicleTypeId || null,
      plate_number: firstVehicle?.plateNumber
        ? firstVehicle.plateNumber.toUpperCase().trim().replace(/\s+/g, '')
        : null,
      driver_name: firstVehicle?.driverName?.trim() || null,
      driver_phone: firstVehicle?.driverPhone?.trim() || null,
    }
  }

  const buildSourceRef = () => {
    // For single vehicle, use vehicle-specific values
    const firstVehicle = vehicles[0]
    return {
      vapp_version: 2,
      sector_id: sectorId,
      functional_area_id: functionalAreaId,
      vlo_name: vloName.trim(),
      vlo_contact_phone: vloContactPhone.trim(),
      vlo_email: vloEmail.trim(),
      // Use first vehicle's values for backward compatibility
      company: firstVehicle?.company?.trim() || null,
      access_zone_id: firstVehicle?.accessZoneId || null,
      access_type_id: firstVehicle?.accessTypeId || null,
      validity_id: firstVehicle?.validityId || null,
      importance_id: firstVehicle?.importanceId || null,
      vehicles: vehicles.map((v) => ({
        vehicle_type_id: v.vehicleTypeId,
        plate_number: v.plateNumber.toUpperCase().trim().replace(/\s+/g, ''),
        driver_name: v.driverName.trim(),
        driver_phone: v.driverPhone.trim(),
        company: v.company?.trim() || null,
        access_zone_id: v.accessZoneId || null,
        access_type_id: v.accessTypeId || null,
        validity_id: v.validityId || null,
        importance_id: v.importanceId || null,
        justification: v.justification?.trim() || null,
      })),
      // Backward-compatible single-vehicle keys (first vehicle)
      vehicle_type_id: firstVehicle.vehicleTypeId,
      plate_number: firstVehicle.plateNumber.toUpperCase().trim().replace(/\s+/g, ''),
      driver_name: firstVehicle.driverName.trim(),
      driver_phone: firstVehicle.driverPhone.trim(),
    }
  }

  // For multi-vehicle submit: build a per-vehicle source_ref snapshot (one vehicle per request)
  const buildSourceRefForVehicle = (vehicle) => ({
    vapp_version: 2,
    sector_id: sectorId,
    functional_area_id: functionalAreaId,
    vlo_name: vloName.trim(),
    vlo_contact_phone: vloContactPhone.trim(),
    vlo_email: vloEmail.trim(),
    // Use vehicle's values for backward compatibility
    company: vehicle?.company?.trim() || null,
    access_zone_id: vehicle?.accessZoneId || null,
    access_type_id: vehicle?.accessTypeId || null,
    validity_id: vehicle?.validityId || null,
    importance_id: vehicle?.importanceId || null,
    vehicles: [
      {
        vehicle_type_id: vehicle.vehicleTypeId,
        plate_number: vehicle.plateNumber.toUpperCase().trim().replace(/\s+/g, ''),
        driver_name: vehicle.driverName.trim(),
        driver_phone: vehicle.driverPhone.trim(),
        company: vehicle.company?.trim() || null,
        access_zone_id: vehicle.accessZoneId || null,
        access_type_id: vehicle.accessTypeId || null,
        validity_id: vehicle.validityId || null,
        importance_id: vehicle.importanceId || null,
        justification: vehicle.justification?.trim() || null,
      },
    ],
    vehicle_type_id: vehicle.vehicleTypeId,
    plate_number: vehicle.plateNumber.toUpperCase().trim().replace(/\s+/g, ''),
    driver_name: vehicle.driverName.trim(),
    driver_phone: vehicle.driverPhone.trim(),
  })

  const handleSaveDraft = async () => {
    if (!client || !eventId) return

    try {
      setSavingDraft(true)

      // Create/update a draft WITHOUT full validation.
      let reqId = request?.id
      if (mode === 'edit') reqId = requestId

      const call = (method, payload) => client.call(method, payload)

      if (!reqId) {
        // Use first vehicle's justification for the request header
        const vehicleJustification = vehicles?.[0]?.justification?.trim() || null
        const createRes = await vappAccessRequestApi.create(call, {
          event_id: eventId,
          justification: vehicleJustification,
          notes: null,
          status: 'draft',
        })
        if (createRes?.status !== 'fulfilled') {
          throw new Error(createRes?.response?.message || createRes?.response || 'Failed to create draft')
        }
        const created = createRes.response?.request || createRes.response
        reqId = created?.id
        setRequest(created)
      }

      if (!reqId || !isValidUUID(reqId)) {
        throw new Error('Failed to determine request id')
      }

      // Use first vehicle's justification for the request header
      const vehicleJustification = vehicles?.[0]?.justification?.trim() || null
      const updateRes = await vappAccessRequestApi.updateHeader(call, eventId, reqId, {
        justification: vehicleJustification || null,
        notes: null,
        source_ref: buildDraftSourceRef(),
      })
      if (updateRes?.status !== 'fulfilled') {
        throw new Error(updateRes?.response?.message || updateRes?.response || 'Failed to save draft')
      }

      toast.success('Draft saved')

      // If we just created a draft in "create" mode, move user to the edit route
      if (mode === 'create') {
        navigate(`/events/${eventId}/vapp/requester/requests/${reqId}`, { replace: true })
      }
    } catch (err) {
      console.error('RequesterAccessRequestForm save draft failed', err)
      toast.error(err?.message || 'Failed to save draft')
    } finally {
      setSavingDraft(false)
    }
  }

  const handleSubmit = async () => {
    console.log('handleSubmit')
    if (!validate()) return
    if (!client || !eventId) return

    try {
      setSaving(true)

      // Check if we're editing an already submitted request
      const isEditingSubmitted = mode === 'edit' && request?.status === 'submitted'

      // v2 semantics: if user entered multiple vehicles, we submit multiple requests (one per vehicle).
      const vehiclesToSubmit = vehicles.slice()
      const call = (method, payload) => client.call(method, payload)

      if (vehiclesToSubmit.length <= 1) {
        // Existing single-request flow
        // 1) Create or update request header
        let reqId = request?.id
        if (mode === 'edit') reqId = requestId

        if (!reqId) {
          // Use first vehicle's justification for the request header
          const vehicleJustification = vehiclesToSubmit[0]?.justification?.trim() || null
          const createRes = await vappAccessRequestApi.create(call, {
            event_id: eventId,
            justification: vehicleJustification,
            notes: null,
            status: 'draft',
          })
          if (createRes?.status !== 'fulfilled') {
            throw new Error(createRes?.response?.message || createRes?.response || 'Failed to create request')
          }
          const created = createRes.response?.request || createRes.response
          reqId = created?.id
          setRequest(created)
        }

        if (!reqId || !isValidUUID(reqId)) {
          throw new Error('Failed to determine request id')
        }

        // 2) Update header + source_ref
        // Use first vehicle's justification
        const vehicleJustification = vehiclesToSubmit[0]?.justification?.trim() || null
        const updateRes = await vappAccessRequestApi.updateHeader(call, eventId, reqId, {
          justification: vehicleJustification,
          notes: null,
          source_ref: buildSourceRef(),
        })
        if (updateRes?.status !== 'fulfilled') {
          throw new Error(updateRes?.response?.message || updateRes?.response || 'Failed to update request')
        }

        // 3) Submit only if not already submitted (if editing submitted request, just save)
        if (!isEditingSubmitted) {
          const submitRes = await vappAccessRequestApi.submit(call, eventId, reqId)
          if (submitRes?.status !== 'fulfilled') {
            throw new Error(submitRes?.response?.message || submitRes?.response || 'Failed to submit request')
          }
        }
      } else {
        // Multi-submit: create/submit one request per vehicle (no quantity).
        // Note: If editing a submitted request, we only update the existing request, don't create new ones
        if (isEditingSubmitted) {
          // When editing a submitted request with multiple vehicles, just update the first vehicle's data
          const first = vehiclesToSubmit[0]
          const vehicleJustification = first?.justification?.trim() || null
          const updateRes = await vappAccessRequestApi.updateHeader(call, eventId, requestId, {
            justification: vehicleJustification,
            notes: null,
            source_ref: buildSourceRef(),
          })
          if (updateRes?.status !== 'fulfilled') {
            throw new Error(updateRes?.response?.message || updateRes?.response || 'Failed to update request')
          }
        } else {
          // Normal multi-submit flow for drafts/new requests
          const createdRequestIds = []

          const reuseExisting = mode === 'edit' && requestId && isValidUUID(requestId)
          if (reuseExisting) {
            const first = vehiclesToSubmit[0]
            const vehicleJustification = first?.justification?.trim() || null
            const updateRes = await vappAccessRequestApi.updateHeader(call, eventId, requestId, {
              justification: vehicleJustification,
              notes: null,
              source_ref: buildSourceRefForVehicle(first),
            })
            if (updateRes?.status !== 'fulfilled') {
              throw new Error(updateRes?.response?.message || updateRes?.response || 'Failed to update request')
            }

            const submitRes = await vappAccessRequestApi.submit(call, eventId, requestId)
            if (submitRes?.status !== 'fulfilled') {
              throw new Error(submitRes?.response?.message || submitRes?.response || 'Failed to submit request')
            }
            createdRequestIds.push(requestId)
          }

          const startIdx = reuseExisting ? 1 : 0
          for (let i = startIdx; i < vehiclesToSubmit.length; i++) {
            const v = vehiclesToSubmit[i]
            const vehicleJustification = v?.justification?.trim() || null
            const createRes = await vappAccessRequestApi.create(call, {
              event_id: eventId,
              justification: vehicleJustification,
              notes: null,
              status: 'draft',
            })
            if (createRes?.status !== 'fulfilled') {
              throw new Error(createRes?.response?.message || createRes?.response || 'Failed to create request')
            }
            const created = createRes.response?.request || createRes.response
            const newReqId = created?.id
            if (!newReqId || !isValidUUID(newReqId)) {
              throw new Error('Failed to determine created request id')
            }

            // Use the vehicle's justification
            const updateRes = await vappAccessRequestApi.updateHeader(call, eventId, newReqId, {
              justification: vehicleJustification,
              notes: null,
              source_ref: buildSourceRefForVehicle(v),
            })
            if (updateRes?.status !== 'fulfilled') {
              throw new Error(updateRes?.response?.message || updateRes?.response || 'Failed to update request')
            }

            const submitRes = await vappAccessRequestApi.submit(call, eventId, newReqId)
            if (submitRes?.status !== 'fulfilled') {
              throw new Error(submitRes?.response?.message || submitRes?.response || 'Failed to submit request')
            }
            createdRequestIds.push(newReqId)
          }
        }
      }

      if (isEditingSubmitted) {
        toast.success('Request updated')
      } else {
        toast.success('Request submitted')
      }
      onDone?.()
      navigate(`/events/${eventId}/vapp/requester/requests`)
    } catch (err) {
      console.error('RequesterAccessRequestForm submit failed', err)
      toast.error(err?.message || 'Failed to submit request')
    } finally {
      setSaving(false)
    }
  }

  const STATUS_COLORS = {
    draft: 'bg-gray-500',
    submitted: 'bg-blue-500',
    under_review: 'bg-orange-500',
    need_info: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    cancelled: 'bg-red-500',
    closed: 'bg-gray-700',
  }

  const STATUS_LABELS = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    need_info: 'Need Info',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    closed: 'Closed',
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>{mode === 'edit' ? 'View Request' : 'Create Request'}</CardTitle>
            <CardDescription>
              {mode === 'edit' 
                ? request 
                  ? `Request ID: ${request.id?.slice(0, 8)}...`
                  : 'Loading request details...'
                : 'Fill in request details and submit.'}
            </CardDescription>
          </div>
          {mode === 'edit' && request && (
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant="outline" 
                className={STATUS_COLORS[request.status] || 'bg-gray-500'}
              >
                {STATUS_LABELS[request.status] || request.status}
              </Badge>
              {request.created_at && (
                <span className="text-xs text-muted-foreground">
                  Created: {new Date(request.created_at).toLocaleDateString()}
                </span>
              )}
              {request.submitted_at && (
                <span className="text-xs text-muted-foreground">
                  Submitted: {new Date(request.submitted_at).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {mode === 'edit' && loading && (
          <div className="text-sm text-muted-foreground">Loading request details...</div>
        )}

        {/* Warning: Edit Window Active with Countdown */}
        {mode === 'edit' && request && isEditable && request.status === 'submitted' && request.submitted_at && event?.settings?.vapp?.request_edit_deadline_hours && timeRemaining !== null && timeRemaining > 0 && (
          <div className="rounded-md border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              <Clock className="h-5 w-5" />
              ⚠️ Edit Window Active - Time Remaining
            </div>
            <div className="text-yellow-800 dark:text-yellow-200">
              <div className="mb-2">
                You can edit this request for:
              </div>
              <div className="font-mono text-lg font-bold text-yellow-900 dark:text-yellow-100">
                {Math.floor(timeRemaining / (60 * 60 * 1000))}h{' '}
                {Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))}m{' '}
                {Math.floor((timeRemaining % (60 * 1000)) / 1000)}s
              </div>
              <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
                Deadline: {event.settings.vapp.request_edit_deadline_hours} hours after submission
              </div>
            </div>
          </div>
        )}

        {mode === 'edit' && request && !isEditable && (
          <div className="rounded-md border bg-blue-50 dark:bg-blue-950/20 p-4 text-sm">
            <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Read-Only View
            </div>
            <div className="text-blue-700 dark:text-blue-300">
              {request.status === 'submitted' && request.submitted_at && event?.settings?.vapp?.request_edit_deadline_hours ? (
                (() => {
                  const deadlineHours = event.settings.vapp.request_edit_deadline_hours
                  const submittedAt = new Date(request.submitted_at)
                  const now = new Date()
                  const deadlineMs = deadlineHours * 60 * 60 * 1000
                  const timeSinceSubmission = now.getTime() - submittedAt.getTime()
                  
                  if (timeSinceSubmission > deadlineMs) {
                    return `Edit deadline has passed. Requests can only be edited within ${deadlineHours} hours after submission.`
                  }
                  return 'This request cannot be edited because it has been submitted.'
                })()
              ) : request.status === 'submitted' ? (
                'This request cannot be edited because it has been submitted.'
              ) : request.status === 'need_info' ? (
                'This request requires additional information. You can edit it to provide the requested information.'
              ) : (
                'This request cannot be edited.'
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MemoSelectField
            label="Functional Area *"
            value={functionalAreaId}
            onValueChange={setFunctionalAreaId}
            disabled={!isEditable}
            placeholder="Select functional area"
            options={functionalAreaOptions}
          />

          <MemoSelectField
            label="Sector *"
            value={sectorId}
            onValueChange={setSectorId}
            disabled={!isEditable}
            placeholder="Select sector"
            options={sectorOptions}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MemoTextField label="VLO Name *" value={vloName} onChange={onChangeVloName} disabled={!isEditable} />
          <MemoTextField
            label="VLO Contact Phone *"
            value={vloContactPhone}
            onChange={onChangeVloContactPhone}
            disabled={!isEditable}
          />
          <MemoTextField label="VLO Email *" value={vloEmail} onChange={onChangeVloEmail} disabled={!isEditable} />
        </div>

        <Separator />

        <MemoVehiclesSection
          vehicles={vehicles}
          setVehicles={setVehicles}
          vehicleTypeOptions={vehicleTypeOptions}
          accessZoneOptions={accessZoneOptions}
          accessTypeOptions={accessTypeOptions}
          validityOptions={validityOptions}
          importanceOptions={importanceOptions}
          isEditable={isEditable}
          saving={saving}
          savingDraft={savingDraft}
          mode={mode}
          request={request}
        />

        {/* Global justification removed - each vehicle now has its own justification field */}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${eventId}/vapp/requester/requests`)}
            disabled={saving || savingDraft}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving || savingDraft || !isEditable}
          >
            {savingDraft ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || savingDraft || !isEditable}>
            {(() => {
              const isEditingSubmitted = mode === 'edit' && request?.status === 'submitted'
              if (isEditingSubmitted) {
                return saving ? 'Saving...' : 'Save'
              }
              return saving ? 'Submitting...' : 'Submit'
            })()}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
