import { Emitter } from '@/lib/event-emitter'

export function createEventBus() {
  const emitter = new Emitter({ maxListeners: 100 })

  return {
    on(event, callback) {
      emitter.on(event, callback)
      return () => emitter.off(event, callback)
    },
    once(event, callback) {
      emitter.once(event, callback)
    },
    emit(event, data) {
      emitter.emit(event, data)
    },
    off(event, callback) {
      emitter.off(event, callback)
    },
    clear(event) {
      emitter.clear(event)
    },
    removeAllListeners() {
      emitter.clear()
    },
    listenerCount(event) {
      return emitter.listenerCount(event)
    },
  }
}
