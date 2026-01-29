import { createModuleBehavior } from './create-module-behavior'
import { vappReviewApi } from '@/lib/services/vapp/vapp-api-service'

export function createReviewModule(client, eventBus) {
  let state = {
    queue: {
      requests: [],
      total: 0,
    },
    queueLoading: false,
    queueError: '',
    bundle: null,
    bundleLoading: false,
    bundleError: '',
  }

  const behavior = createModuleBehavior(eventBus, {
    name: 'review',
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

  const listQueue = async (eventId, filters = {}) => {
    if (!client) throw new Error('Transport client not ready')
    if (!eventId) throw new Error('Event ID is required')
    
    setState({ queueLoading: true, queueError: '' })
    try {
      const call = (method, payload) => client.call(method, payload)
      const result = await vappReviewApi.listQueue(call, eventId, filters)
      const data = unwrap(result, 'Failed to load review queue')
      setState({
        queue: {
          requests: data?.requests || [],
          total: data?.total || 0,
        },
      })
      if (eventBus) eventBus.emit('review:queue:loaded', data)
      return data
    } catch (error) {
      setState({ queueError: error.message || 'Failed to load review queue' })
      throw error
    } finally {
      setState({ queueLoading: false })
    }
  }

  const getBundle = async (eventId, requestId) => {
    if (!client) throw new Error('Transport client not ready')
    if (!eventId) throw new Error('Event ID is required')
    if (!requestId) throw new Error('Request ID is required')
    
    setState({ bundleLoading: true, bundleError: '' })
    try {
      const call = (method, payload) => client.call(method, payload)
      const result = await vappReviewApi.getBundle(call, eventId, requestId)
      const data = unwrap(result, 'Failed to load review bundle')
      setState({ bundle: data })
      if (eventBus) eventBus.emit('review:bundle:loaded', data)
      return data
    } catch (error) {
      const errorMessage = error.message || 'Failed to load review bundle'
      // Provide more user-friendly error messages
      let friendlyMessage = errorMessage
      if (errorMessage.includes('Connection closed') || errorMessage.includes('WebSocket not connected')) {
        friendlyMessage = 'Connection lost. Please refresh the page or check your network connection.'
      }
      setState({ bundleError: friendlyMessage })
      throw new Error(friendlyMessage)
    } finally {
      setState({ bundleLoading: false })
    }
  }

  const subscribe = (listener) => behavior.subscribe(listener)

  const getState = () => state

  return {
    listQueue,
    getBundle,
    subscribe,
    getState,
  }
}
