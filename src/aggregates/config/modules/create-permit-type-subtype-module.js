import { createModuleBehavior } from './create-module-behavior'
import { validateUUID } from '@/lib/utils/uuid'

export function createPermitTypeSubtypeModule(client, eventBus) {
  let state = {
    list: [],
    listLoading: false,
    listError: '',
  }

  const behavior = createModuleBehavior(eventBus, {
    name: 'permitTypeSubtype',
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

  const list = async (eventId, permitTypeId) => {
    if (!client) throw new Error('Transport client not ready')
    validateUUID(eventId, 'Event ID for subtype list')
    validateUUID(permitTypeId, 'Permit Type ID for subtype list')
    setState({ listLoading: true, listError: '' })
    try {
      const result = await client.call('vapp.config.permitTypeSubtype.list', {
        event_id: eventId,
        permit_type_id: permitTypeId,
      })
      const data = unwrap(result, 'Failed to load subtypes')
      const subtypes = Array.isArray(data) ? data : (data?.subtypes || [])
      setState({ list: subtypes })
      if (eventBus) eventBus.emit('permitTypeSubtype:list:loaded', subtypes)
      return subtypes
    } catch (error) {
      setState({ listError: error.message || 'Failed to load subtypes' })
      throw error
    } finally {
      setState({ listLoading: false })
    }
  }

  const create = async (payload) => {
    if (!client) throw new Error('Transport client not ready')
    validateUUID(payload.event_id, 'Event ID for subtype creation')
    validateUUID(payload.permit_type_id, 'Permit Type ID for subtype creation')
    const result = await client.call('vapp.config.permitTypeSubtype.create', payload)
    const created = unwrap(result, 'Failed to create subtype')
    if (eventBus) eventBus.emit('permitTypeSubtype:created', created)
    await list(payload.event_id, payload.permit_type_id)
    return created
  }

  const deleteItem = async (eventId, permitTypeId, subtypeId) => {
    if (!client) throw new Error('Transport client not ready')
    validateUUID(eventId, 'Event ID for subtype deletion')
    validateUUID(permitTypeId, 'Permit Type ID for subtype deletion')
    validateUUID(subtypeId, 'Subtype ID for deletion')
    const result = await client.call('vapp.config.permitTypeSubtype.delete', {
      event_id: eventId,
      permit_type_id: permitTypeId,
      subtype_id: subtypeId,
    })
    const deleted = unwrap(result, 'Failed to delete subtype')
    if (eventBus) eventBus.emit('permitTypeSubtype:deleted', deleted)
    await list(eventId, permitTypeId)
    return deleted
  }

  const subscribe = (listener) => behavior.subscribe(listener)
  const getState = () => state

  return {
    list,
    create,
    delete: deleteItem,
    subscribe,
    getState,
  }
}
