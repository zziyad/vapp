import { createModuleBehavior } from './create-module-behavior'
import { vappDashboardApi } from '@/lib/services/vapp/vapp-api-service'

export function createDashboardModule(client, eventBus) {
  let state = {
    stats: null,
    statsLoading: false,
    statsError: '',
  }

  const behavior = createModuleBehavior(eventBus, {
    name: 'dashboard',
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

  const stats = async (eventId) => {
    if (!client) throw new Error('Transport client not ready')
    if (!eventId) throw new Error('Event ID is required')
    
    setState({ statsLoading: true, statsError: '' })
    try {
      const call = (method, payload) => client.call(method, payload)
      const result = await vappDashboardApi.stats(call, eventId)
      const data = unwrap(result, 'Failed to load dashboard stats')
      setState({ stats: data })
      if (eventBus) eventBus.emit('dashboard:stats:loaded', data)
      return data
    } catch (error) {
      setState({ statsError: error.message || 'Failed to load dashboard stats' })
      throw error
    } finally {
      setState({ statsLoading: false })
    }
  }

  const subscribe = (listener) => behavior.subscribe(listener)

  const getState = () => state

  return {
    stats,
    subscribe,
    getState,
  }
}
