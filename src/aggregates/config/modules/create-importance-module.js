import { createModuleBehavior } from './create-module-behavior'

export function createImportanceModule(client, eventBus) {
  let state = {
    list: [],
    listLoading: false,
    listError: '',
    detail: null,
    detailLoading: false,
    detailError: '',
  }

  const behavior = createModuleBehavior(eventBus, {
    name: 'importance',
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

  const list = async (params = {}) => {
    if (!client) throw new Error('Transport client not ready')
    setState({ listLoading: true, listError: '' })
    try {
      const result = await client.call('importance/list', params)
      const data = unwrap(result, 'Failed to load importance levels')
      // API returns array directly or wrapped in object
      const items = Array.isArray(data) ? data : (data?.importance || data?.items || [])
      setState({ list: items })
      if (eventBus) eventBus.emit('importance:list:loaded', items)
      return items
    } catch (error) {
      setState({ listError: error.message || 'Failed to load importance levels' })
      throw error
    } finally {
      setState({ listLoading: false })
    }
  }

  const getById = async (id) => {
    if (!client) throw new Error('Transport client not ready')
    if (!id) throw new Error('Importance id is required')
    setState({ detailLoading: true, detailError: '' })
    try {
      const result = await client.call('importance/getById', { id })
      const data = unwrap(result, 'Importance not found')
      setState({ detail: data })
      if (eventBus) eventBus.emit('importance:detail:loaded', data)
      return data
    } catch (error) {
      setState({ detailError: error.message || 'Importance not found' })
      throw error
    } finally {
      setState({ detailLoading: false })
    }
  }

  // Note: Importance has no create endpoint (seeded only)
  const update = async (payload) => {
    if (!client) throw new Error('Transport client not ready')
    if (!payload.id) throw new Error('Importance ID is required')
    const result = await client.call('importance/update', payload)
    const data = unwrap(result, 'Failed to update importance')
    // API returns importance object directly
    const updated = data?.importance || data
    if (eventBus) eventBus.emit('importance:updated', updated)
    await list()
    return updated
  }

  const deleteItem = async (id) => {
    if (!client) throw new Error('Transport client not ready')
    if (!id) throw new Error('Importance id is required')
    // Importance always uses soft delete (hard_delete ignored)
    const result = await client.call('importance/delete', { id })
    const deleted = unwrap(result, 'Failed to delete importance')
    if (eventBus) eventBus.emit('importance:deleted', deleted)
    await list()
    return deleted
  }

  const subscribe = (listener) => behavior.subscribe(listener)
  const getState = () => state

  return {
    list,
    getById,
    update,
    delete: deleteItem,
    subscribe,
    getState,
  }
}
