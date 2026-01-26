import { createModuleBehavior } from './create-module-behavior'
import { validateUUID } from '@/lib/utils/uuid'

export function createFunctionalAreaModule(client, eventBus) {
  let state = {
    list: [],
    listLoading: false,
    listError: '',
    detail: null,
    detailLoading: false,
    detailError: '',
  }

  const behavior = createModuleBehavior(eventBus, {
    name: 'functionalArea',
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
      const result = await client.call('functionalArea/list', { event_id: eventId, ...params })
      const data = unwrap(result, 'Failed to load functional areas')
      const items = Array.isArray(data) ? data : (data?.functionalAreas || [])
      setState({ list: items })
      if (eventBus) eventBus.emit('functionalArea:list:loaded', items)
      return items
    } catch (error) {
      setState({ listError: error.message || 'Failed to load functional areas' })
      throw error
    } finally {
      setState({ listLoading: false })
    }
  }

  const getById = async (id) => {
    if (!client) throw new Error('Transport client not ready')
    if (!id) throw new Error('Functional area id is required')
    setState({ detailLoading: true, detailError: '' })
    try {
      const result = await client.call('functionalArea/getById', { id })
      const data = unwrap(result, 'Functional area not found')
      setState({ detail: data })
      if (eventBus) eventBus.emit('functionalArea:detail:loaded', data)
      return data
    } catch (error) {
      setState({ detailError: error.message || 'Functional area not found' })
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
    const result = await client.call('functionalArea/create', payload)
    const created = unwrap(result, 'Failed to create functional area')
    if (eventBus) eventBus.emit('functionalArea:created', created)
    if (payload.event_id) {
      await list(payload.event_id)
    }
    return created
  }

  const update = async (payload) => {
    if (!client) throw new Error('Transport client not ready')
    const result = await client.call('functionalArea/update', payload)
    const updated = unwrap(result, 'Failed to update functional area')
    if (eventBus) eventBus.emit('functionalArea:updated', updated)
    const current = state.list.find(item => item.id === updated.id)
    if (current) {
      await list(current.event_id)
    }
    return updated
  }

  const deleteItem = async (id, hardDelete = false) => {
    if (!client) throw new Error('Transport client not ready')
    if (!id) throw new Error('Functional area id is required')
    const result = await client.call('functionalArea/delete', { id, hard_delete: hardDelete })
    const deleted = unwrap(result, 'Failed to delete functional area')
    if (eventBus) eventBus.emit('functionalArea:deleted', deleted)
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
