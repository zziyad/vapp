import { createModuleBehavior } from './create-module-behavior'
import { validateUUID } from '@/lib/utils/uuid'

export function createSectorModule(client, eventBus) {
  let state = {
    list: [],
    listLoading: false,
    listError: '',
    detail: null,
    detailLoading: false,
    detailError: '',
  }

  const behavior = createModuleBehavior(eventBus, {
    name: 'sector',
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
      throw new Error(result.response || fallbackMessage)
    }
    return result
  }

  const list = async (eventId, params = {}) => {
    if (!client) throw new Error('Transport client not ready')
    if (!eventId) throw new Error('Event ID is required')
    validateUUID(eventId, 'event_id')
    setState({ listLoading: true, listError: '' })
    try {
      const result = await client.call('sector/list', { event_id: eventId, ...params })
      const data = unwrap(result, 'Failed to load sectors')
      const sectors = Array.isArray(data) ? data : (data?.sectors || [])
      setState({ list: sectors })
      if (eventBus) eventBus.emit('sector:list:loaded', sectors)
      return sectors
    } catch (error) {
      setState({ listError: error.message || 'Failed to load sectors' })
      throw error
    } finally {
      setState({ listLoading: false })
    }
  }

  const getById = async (id) => {
    if (!client) throw new Error('Transport client not ready')
    if (!id) throw new Error('Sector id is required')
    setState({ detailLoading: true, detailError: '' })
    try {
      const result = await client.call('sector/getById', { id })
      const data = unwrap(result, 'Sector not found')
      setState({ detail: data })
      if (eventBus) eventBus.emit('sector:detail:loaded', data)
      return data
    } catch (error) {
      setState({ detailError: error.message || 'Sector not found' })
      throw error
    } finally {
      setState({ detailLoading: false })
    }
  }

  const create = async (payload) => {
    if (!client) throw new Error('Transport client not ready')
    if (payload.event_id) {
      validateUUID(payload.event_id, 'event_id')
    }
    const result = await client.call('sector/create', payload)
    const created = unwrap(result, 'Failed to create sector')
    if (eventBus) eventBus.emit('sector:created', created)
    // Refresh list after create
    if (payload.event_id) {
      await list(payload.event_id)
    }
    return created
  }

  const update = async (payload) => {
    if (!client) throw new Error('Transport client not ready')
    const result = await client.call('sector/update', payload)
    const updated = unwrap(result, 'Failed to update sector')
    if (eventBus) eventBus.emit('sector:updated', updated)
    // Refresh list after update
    const currentSector = state.list.find(s => s.id === updated.id)
    if (currentSector) {
      await list(currentSector.event_id)
    }
    return updated
  }

  const deleteItem = async (id, hardDelete = false) => {
    if (!client) throw new Error('Transport client not ready')
    if (!id) throw new Error('Sector id is required')
    const result = await client.call('sector/delete', { id, hard_delete: hardDelete })
    const deleted = unwrap(result, 'Failed to delete sector')
    if (eventBus) eventBus.emit('sector:deleted', deleted)
    // Refresh list after delete
    const currentSector = state.list.find(s => s.id === id)
    if (currentSector) {
      await list(currentSector.event_id)
    }
    return deleted
  }

  const subscribe = (listener) => behavior.subscribe(listener)
  const getState = () => state

  return {
    list,
    getById,
    create,
    update,
    delete: deleteItem,
    subscribe,
    getState,
  }
}
