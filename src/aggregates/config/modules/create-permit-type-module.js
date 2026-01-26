import { createModuleBehavior } from './create-module-behavior'
import { validateUUID } from '@/lib/utils/uuid'

export function createPermitTypeModule(client, eventBus) {
  let state = {
    list: [],
    listLoading: false,
    listError: '',
    detail: null,
    detailLoading: false,
    detailError: '',
    totalSubtypes: 0,
  }

  const behavior = createModuleBehavior(eventBus, {
    name: 'permitType',
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

  const list = async (eventId, params = {}) => {
    if (!client) throw new Error('Transport client not ready')
    validateUUID(eventId, 'Event ID for permit type list')
    setState({ listLoading: true, listError: '' })
    try {
      const result = await client.call('vapp.config.permitType.list', { event_id: eventId, ...params })
      const data = unwrap(result, 'Failed to load permit types')
      // API returns { permitTypes } (camelCase) or array
      const permitTypes = Array.isArray(data) ? data : (data?.permitTypes || data?.permit_types || [])
      
      // Calculate total subtypes
      let totalSubtypes = 0
      if (data?.total_subtypes !== undefined) {
        totalSubtypes = data.total_subtypes
      } else {
        // Fallback: count subtypes if available in response
        permitTypes.forEach(pt => {
          if (pt.subtypes && Array.isArray(pt.subtypes)) {
            totalSubtypes += pt.subtypes.length
          }
        })
      }
      
      setState({ list: permitTypes, totalSubtypes })
      if (eventBus) eventBus.emit('permitType:list:loaded', permitTypes)
      return permitTypes
    } catch (error) {
      setState({ listError: error.message || 'Failed to load permit types' })
      throw error
    } finally {
      setState({ listLoading: false })
    }
  }

  const getById = async (id) => {
    if (!client) throw new Error('Transport client not ready')
    validateUUID(id, 'Permit Type ID for detail')
    setState({ detailLoading: true, detailError: '' })
    try {
      const result = await client.call('vapp.config.permitType.get', { permit_type_id: id })
      const data = unwrap(result, 'Permit type not found')
      setState({ detail: data })
      if (eventBus) eventBus.emit('permitType:detail:loaded', data)
      return data
    } catch (error) {
      setState({ detailError: error.message || 'Permit type not found' })
      throw error
    } finally {
      setState({ detailLoading: false })
    }
  }

  const create = async (payload) => {
    if (!client) throw new Error('Transport client not ready')
    validateUUID(payload.event_id, 'Event ID for permit type creation')
    const result = await client.call('vapp.config.permitType.create', payload)
    const data = unwrap(result, 'Failed to create permit type')
    // API returns { permitType } (camelCase)
    const created = data?.permitType || data
    if (eventBus) eventBus.emit('permitType:created', created)
    if (payload.event_id) {
      await list(payload.event_id)
    }
    return created
  }

  const update = async (payload) => {
    if (!client) throw new Error('Transport client not ready')
    validateUUID(payload.permit_type_id || payload.id, 'Permit Type ID for update')
    const result = await client.call('vapp.config.permitType.update', {
      permit_type_id: payload.permit_type_id || payload.id,
      event_id: payload.event_id,
      ...payload,
    })
    const data = unwrap(result, 'Failed to update permit type')
    // API returns { permitType } (camelCase)
    const updated = data?.permitType || data
    if (eventBus) eventBus.emit('permitType:updated', updated)
    const currentType = state.list.find(pt => pt.id === (payload.permit_type_id || payload.id))
    if (currentType) {
      await list(currentType.event_id || payload.event_id)
    }
    return updated
  }

  const toggleActive = async (eventId, id) => {
    if (!client) throw new Error('Transport client not ready')
    validateUUID(eventId, 'Event ID for toggle active')
    validateUUID(id, 'Permit Type ID for toggle active')
    const result = await client.call('vapp.config.permitType.toggleActive', {
      event_id: eventId,
      permit_type_id: id,
    })
    const data = unwrap(result, 'Failed to toggle permit type status')
    // API returns { permitType } (camelCase)
    const updated = data?.permitType || data
    if (eventBus) eventBus.emit('permitType:toggled', updated)
    await list(eventId)
    return updated
  }

  const deleteItem = async (id, hardDelete = false) => {
    if (!client) throw new Error('Transport client not ready')
    validateUUID(id, 'Permit Type ID for deletion')
    // Note: Backend might not have delete endpoint, using update to set is_active = false
    const currentType = state.list.find(pt => pt.id === id)
    if (currentType) {
      await update({
        id: currentType.id,
        event_id: currentType.event_id,
        is_active: false,
      })
    }
    if (eventBus) eventBus.emit('permitType:deleted', { id })
    return { id }
  }

  const subscribe = (listener) => behavior.subscribe(listener)
  const getState = () => state

  return {
    list,
    getById,
    create,
    update,
    toggleActive,
    delete: deleteItem,
    subscribe,
    getState,
  }
}
