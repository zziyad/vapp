import { createModuleBehavior } from './create-module-behavior'

export function createEventsModule(client, eventBus) {
  let state = {
    list: {
      events: [],
      pagination: null,
    },
    listLoading: false,
    listError: '',
    detail: null,
    detailLoading: false,
    detailError: '',
  }

  const behavior = createModuleBehavior(eventBus, {
    name: 'events',
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

  const list = async (params) => {
    if (!client) throw new Error('Transport client not ready')
    setState({ listLoading: true, listError: '' })
    try {
      const result = await client.api.event.list(params || {})
      const data = unwrap(result, 'Failed to load events')
      setState({
        list: {
          events: data?.events || [],
          pagination: data?.pagination || null,
        },
      })
      if (eventBus) eventBus.emit('events:list:loaded', data)
      return data
    } catch (error) {
      setState({ listError: error.message || 'Failed to load events' })
      throw error
    } finally {
      setState({ listLoading: false })
    }
  }

  const detail = async (id) => {
    if (!client) throw new Error('Transport client not ready')
    if (!id) throw new Error('Event id is required')
    setState({ detailLoading: true, detailError: '' })
    try {
      const result = await client.api.event.detail({ id })
      const data = unwrap(result, 'Event not found')
      setState({ detail: data })
      if (eventBus) eventBus.emit('events:detail:loaded', data)
      return data
    } catch (error) {
      setState({ detailError: error.message || 'Event not found' })
      throw error
    } finally {
      setState({ detailLoading: false })
    }
  }

  const create = async (payload) => {
    if (!client) throw new Error('Transport client not ready')
    const result = await client.api.event.create(payload)
    const created = unwrap(result, 'Failed to create event')
    if (eventBus) eventBus.emit('events:created', created)
    return created
  }

  const update = async (payload) => {
    if (!client) throw new Error('Transport client not ready')
    setState({ updateLoading: true, updateError: '' })
    try {
      console.log('EventsModule: Updating event', payload)
      const result = await client.api.event.update(payload)
      const updated = unwrap(result, 'Failed to update event')
      console.log('EventsModule: Update successful', { updatedId: updated?.id, currentDetailId: state.detail?.id, settings: updated?.settings })
      // Always update state.detail if we have an updated event (even if IDs don't match, update anyway)
      if (updated) {
        console.log('EventsModule: Updating state.detail with new event data', {
          oldSettings: state.detail?.settings,
          newSettings: updated.settings
        })
        setState({ detail: updated })
      }
      if (eventBus) eventBus.emit('events:updated', updated)
      return updated
    } catch (error) {
      console.error('EventsModule: Update failed', error)
      setState({ updateError: error.message || 'Failed to update event' })
      throw error
    } finally {
      setState({ updateLoading: false })
    }
  }

  const setDetail = (value) => {
    setState({ detail: value, detailError: '' })
  }

  const subscribe = (listener) => behavior.subscribe(listener)

  const getState = () => state

  return {
    list,
    detail,
    create,
    update,
    setDetail,
    subscribe,
    getState,
  }
}
