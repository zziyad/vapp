import { createEventsModule } from './modules/create-events-module'
import { createEventBus } from '@/lib/aggregates/event-bus'
import { collect } from '@/lib/collector'

export function createEventAggregate(eventId, client, options = {}) {
  const eventBus = createEventBus()
  const events = createEventsModule(client, eventBus)

  return {
    eventId,
    events,
    eventBus,
    async loadAll(params = {}) {
      const keys = eventId ? ['detail'] : ['list']
      const collector = collect(keys, {
        timeout: options.timeout || 20000,
        softFail: true,
        defaults: {
          list: { events: [], pagination: null },
          detail: null,
        },
        validate: options.validate || null,
      })

      if (eventId) {
        collector.wait('detail', () => events.detail(eventId))
      } else {
        collector.wait('list', () => events.list(params))
      }

      return collector
    },
  }
}
