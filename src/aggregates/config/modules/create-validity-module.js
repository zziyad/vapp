import { createModuleBehavior } from './create-module-behavior'
import { validateUUID } from '@/lib/utils/uuid'

export function createValidityModule(client, eventBus) {
  let state = {
    list: [],
    listLoading: false,
    listError: '',
    detail: null,
    detailLoading: false,
    detailError: '',
  }

  const behavior = createModuleBehavior(eventBus, {
    name: 'validity',
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
      const result = await client.call('validity/list', { event_id: eventId, ...params })
      const data = unwrap(result, 'Failed to load validity periods')
      const items = Array.isArray(data) ? data : (data?.validity || [])
      setState({ list: items })
      if (eventBus) eventBus.emit('validity:list:loaded', items)
      return items
    } catch (error) {
      setState({ listError: error.message || 'Failed to load validity periods' })
      throw error
    } finally {
      setState({ listLoading: false })
    }
  }

  const getById = async (id) => {
    if (!client) throw new Error('Transport client not ready')
    if (!id) throw new Error('Validity id is required')
    setState({ detailLoading: true, detailError: '' })
    try {
      const result = await client.call('validity/getById', { id })
      const data = unwrap(result, 'Validity not found')
      setState({ detail: data })
      if (eventBus) eventBus.emit('validity:detail:loaded', data)
      return data
    } catch (error) {
      setState({ detailError: error.message || 'Validity not found' })
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
    const result = await client.call('validity/create', payload)
    const created = unwrap(result, 'Failed to create validity')
    if (eventBus) eventBus.emit('validity:created', created)
    if (payload.event_id) {
      await list(payload.event_id)
    }
    return created
  }

  const update = async (payload) => {
    if (!client) throw new Error('Transport client not ready')
    const result = await client.call('validity/update', payload)
    const updated = unwrap(result, 'Failed to update validity')
    if (eventBus) eventBus.emit('validity:updated', updated)
    const current = state.list.find(item => item.id === updated.id)
    if (current) {
      await list(current.event_id)
    }
    return updated
  }

  const deleteItem = async (id, hardDelete = false) => {
    if (!client) throw new Error('Transport client not ready')
    if (!id) throw new Error('Validity id is required')
    const result = await client.call('validity/delete', { id, hard_delete: hardDelete })
    const deleted = unwrap(result, 'Failed to delete validity')
    if (eventBus) eventBus.emit('validity:deleted', deleted)
    const current = state.list.find(item => item.id === id)
    if (current) {
      await list(current.event_id)
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
