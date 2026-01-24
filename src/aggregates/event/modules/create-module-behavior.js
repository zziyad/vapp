export function createModuleBehavior(eventBus, options = {}) {
  const name = options.name || 'module'
  let data = options.initial || null
  let loading = false
  let error = null
  const listeners = new Set()

  const notify = () => {
    const snapshot = { data, loading, error }
    listeners.forEach((listener) => {
      try {
        listener(snapshot.data)
      } catch (err) {
        console.error(`[${name}] Listener error:`, err)
      }
    })
    if (eventBus) {
      eventBus.emit(`${name}:state`, snapshot)
    }
  }

  const setState = (updates) => {
    if ('data' in updates) data = updates.data
    if ('loading' in updates) loading = updates.loading
    if ('error' in updates) error = updates.error
    notify()
  }

  const reset = () => {
    data = options.initial || null
    loading = false
    error = null
    notify()
  }

  const subscribe = (listener) => {
    listeners.add(listener)
    try {
      listener(data)
    } catch (err) {
      console.error(`[${name}] Subscriber error:`, err)
    }
    return () => listeners.delete(listener)
  }

  return {
    get data() {
      return data
    },
    get loading() {
      return loading
    },
    get error() {
      return error
    },
    setState,
    reset,
    subscribe,
  }
}
