import { createModuleBehavior } from './create-module-behavior'
import { validateUUID } from '@/lib/utils/uuid'

export function createAccessTypeModule(client, eventBus) {
  let state = {
    list: [],
    listLoading: false,
    listError: '',
    detail: null,
    detailLoading: false,
    detailError: '',
  }

  const behavior = createModuleBehavior(eventBus, {
    name: 'accessType',
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

  const list = async (eventId = null, params = {}) => {
    if (!client) throw new Error('Transport client not ready')
    setState({ listLoading: true, listError: '' })
    try {
      const payload = eventId ? { event_id: eventId, ...params } : params
      if (eventId) {
        validateUUID(eventId, 'event_id')
      }
      const result = await client.call('accessType/list', payload)
      const data = unwrap(result, 'Failed to load access types')
      const items = Array.isArray(data) ? data : (data?.accessTypes || [])
      setState({ list: items })
      if (eventBus) eventBus.emit('accessType:list:loaded', items)
      return items
    } catch (error) {
      setState({ listError: error.message || 'Failed to load access types' })
      throw error
    } finally {
      setState({ listLoading: false })
    }
  }

  const getById = async (id) => {
    if (!client) throw new Error('Transport client not ready')
    if (!id) throw new Error('Access type id is required')
    setState({ detailLoading: true, detailError: '' })
    try {
      const result = await client.call('accessType/getById', { id })
      const data = unwrap(result, 'Access type not found')
      setState({ detail: data })
      if (eventBus) eventBus.emit('accessType:detail:loaded', data)
      return data
    } catch (error) {
      setState({ detailError: error.message || 'Access type not found' })
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
    const result = await client.call('accessType/create', payload)
    const created = unwrap(result, 'Failed to create access type')
    if (eventBus) eventBus.emit('accessType:created', created)
    if (payload.event_id) {
      await list(payload.event_id)
    } else {
      await list()
    }
    return created
  }

  const update = async (payload) => {
    if (!client) throw new Error('Transport client not ready')
    const result = await client.call('accessType/update', payload)
    const updated = unwrap(result, 'Failed to update access type')
    if (eventBus) eventBus.emit('accessType:updated', updated)
    const current = state.list.find(item => item.id === updated.id)
    if (current) {
      await list(current.event_id || null)
    }
    return updated
  }

  const deleteItem = async (id, hardDelete = false) => {
    if (!client) throw new Error('Transport client not ready')
    if (!id) throw new Error('Access type id is required')
    const result = await client.call('accessType/delete', { id, hard_delete: hardDelete })
    const deleted = unwrap(result, 'Failed to delete access type')
    if (eventBus) eventBus.emit('accessType:deleted', deleted)
    const current = state.list.find(item => item.id === id)
    if (current) {
      await list(current.event_id || null)
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
