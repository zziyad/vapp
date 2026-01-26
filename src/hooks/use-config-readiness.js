import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { getConfigAggregate } from '@/aggregates/config/get-config-aggregate'
import { isValidUUID } from '@/lib/utils/uuid'

/**
 * useConfigReadiness
 * Readiness for v2 "request configuration entities" wizard:
 * Sector, FunctionalArea, VehicleType, AccessZone, AccessType, Validity, Importance (optional).
 */
export function useConfigReadiness(eventId) {
  const { client } = useTransport()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const isEventIdValid = useMemo(() => isValidUUID(eventId), [eventId])

  const aggregate = useMemo(() => {
    if (!client || !isEventIdValid) return null
    return getConfigAggregate(eventId, client)
  }, [client, eventId, isEventIdValid])

  const aggregateRef = useRef(aggregate)
  useEffect(() => {
    aggregateRef.current = aggregate
  }, [aggregate])

  const fetchAll = useCallback(async () => {
    const currentAggregate = aggregateRef.current
    if (!currentAggregate || !isEventIdValid) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch all config entities in parallel using aggregate modules
      const [
        sectors,
        functionalAreas,
        vehicleTypes,
        accessZones,
        accessTypes,
        validities,
        importances,
      ] = await Promise.all([
        currentAggregate.sector.list(eventId).catch(() => []),
        currentAggregate.functionalArea.list(eventId).catch(() => []),
        currentAggregate.vehicleType.list(eventId).catch(() => []),
        currentAggregate.accessZone.list(eventId).catch(() => []),
        currentAggregate.accessType.list(eventId).catch(() => []),
        currentAggregate.validity.list(eventId).catch(() => []),
        currentAggregate.importance.list().catch(() => []),
      ])

      setData({
        sectors_count: Array.isArray(sectors) ? sectors.length : 0,
        functional_areas_count: Array.isArray(functionalAreas) ? functionalAreas.length : 0,
        vehicle_types_count: Array.isArray(vehicleTypes) ? vehicleTypes.length : 0,
        access_zones_count: Array.isArray(accessZones) ? accessZones.length : 0,
        access_types_count: Array.isArray(accessTypes) ? accessTypes.length : 0,
        validity_count: Array.isArray(validities) ? validities.length : 0,
        importance_count: Array.isArray(importances) ? importances.length : 0,
      })
    } catch (e) {
      console.error('Failed to fetch config readiness:', e)
      setError(e)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [eventId, isEventIdValid])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const checklistItems = useMemo(() => {
    const d = data || {}
    return [
      { key: 'sectors', label: 'Sectors', done: (d.sectors_count || 0) > 0, required: true },
      {
        key: 'functional-areas',
        label: 'Functional Areas',
        done: (d.functional_areas_count || 0) > 0,
        required: true,
      },
      {
        key: 'vehicle-types',
        label: 'Vehicle Types',
        done: (d.vehicle_types_count || 0) > 0,
        required: true,
      },
      {
        key: 'access-zones',
        label: 'Access Zones',
        done: (d.access_zones_count || 0) > 0,
        required: true,
      },
      {
        key: 'access-types',
        label: 'Access Types',
        done: (d.access_types_count || 0) > 0,
        required: true,
      },
      { key: 'validity', label: 'Validity', done: (d.validity_count || 0) > 0, required: true },
      {
        key: 'importance',
        label: 'Importance (optional)',
        done: true,
        required: false,
      },
    ]
  }, [data])

  const blockers = useMemo(
    () => checklistItems.filter((x) => x.required && !x.done),
    [checklistItems]
  )

  const ready = blockers.length === 0
  const completionPercent = useMemo(() => {
    const required = checklistItems.filter((x) => x.required)
    if (required.length === 0) return 0
    const done = required.filter((x) => x.done).length
    return Math.round((done / required.length) * 100)
  }, [checklistItems])

  const firstIncompleteStep = useMemo(() => {
    const idx = checklistItems.findIndex((x) => x.required && !x.done)
    return idx >= 0 ? idx : null
  }, [checklistItems])

  return {
    loading,
    error,
    readiness: data,
    ready,
    completionPercent,
    checklistItems,
    blockers,
    summary: data,
    firstIncompleteStep,
    refetch: fetchAll,
  }
}
