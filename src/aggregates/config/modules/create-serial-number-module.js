import { createModuleBehavior } from './create-module-behavior'
import { validateUUID } from '@/lib/utils/uuid'

export function createSerialNumberModule(client, eventBus) {
  let state = {
    list: [],
    listLoading: false,
    listError: '',
    summary: { total: 0, available: 0, assigned: 0, used: 0 },
    nextStarting: null,
    nextStartingLoading: false,
  }

  const behavior = createModuleBehavior(eventBus, {
    name: 'serialNumber',
    initial: { ...state },
  })

  const setState = (partial) => {
    state = { ...state, ...partial }
    behavior.setState({ data: state })
  }

  const unwrap = (result, fallbackMessage) => {
    if (!result) throw new Error(fallbackMessage)
    if (result.status === 'fulfilled') return result.response
    if (result.status === 'rejected') {
      throw new Error(result.response?.message || result.response || fallbackMessage)
    }
    return result
  }

  const list = async (eventId, permitTypeId, subtypeCode = null) => {
    if (!client) throw new Error('Transport client not ready')
    validateUUID(eventId, 'Event ID for serial number list')
    validateUUID(permitTypeId, 'Permit Type ID for serial number list')
    setState({ listLoading: true, listError: '' })
    try {
      const result = await client.call('vapp.config.serialNumber.list', {
        event_id: eventId,
        permit_type_id: permitTypeId,
        subtype_code: subtypeCode || null,
      })
      const data = unwrap(result, 'Failed to load serial numbers')
      const serialNumbers = data?.serialNumbers || data?.list || (Array.isArray(data) ? data : [])
      const summary = data?.summary || { total: 0, available: 0, assigned: 0, used: 0 }
      setState({ list: serialNumbers, summary })
      if (eventBus) eventBus.emit('serialNumber:list:loaded', serialNumbers)
      return { serialNumbers, summary }
    } catch (error) {
      setState({ listError: error.message || 'Failed to load serial numbers' })
      throw error
    } finally {
      setState({ listLoading: false })
    }
  }

  const getNextStarting = async (eventId, permitTypeId, subtypeCode = null) => {
    if (!client) throw new Error('Transport client not ready')
    validateUUID(eventId, 'Event ID for next starting number')
    validateUUID(permitTypeId, 'Permit Type ID for next starting number')
    setState({ nextStartingLoading: true })
    try {
      const result = await client.call('vapp.config.serialNumber.getNextStarting', {
        event_id: eventId,
        permit_type_id: permitTypeId,
        subtype_code: subtypeCode || null,
      })
      const data = unwrap(result, 'Failed to get next starting number')
      setState({ nextStarting: data })
      return data
    } catch (error) {
      // Not an error - just means no serials exist yet
      setState({ nextStarting: null })
      return null
    } finally {
      setState({ nextStartingLoading: false })
    }
  }

  const generate = async (payload) => {
    if (!client) throw new Error('Transport client not ready')
    validateUUID(payload.event_id, 'Event ID for serial number generation')
    validateUUID(payload.permit_type_id, 'Permit Type ID for serial number generation')
    const result = await client.call('vapp.config.serialNumber.generate', payload)
    const data = unwrap(result, 'Failed to generate serial numbers')
    if (eventBus) eventBus.emit('serialNumber:generated', data)
    // Reload list after generation
    await list(payload.event_id, payload.permit_type_id, payload.subtype_code || null)
    return data
  }

  const subscribe = (listener) => behavior.subscribe(listener)
  const getState = () => state

  return {
    list,
    getNextStarting,
    generate,
    subscribe,
    getState,
  }
}
