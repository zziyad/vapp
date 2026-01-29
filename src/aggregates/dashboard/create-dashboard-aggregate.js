import { createDashboardModule } from './modules/create-dashboard-module'
import { createEventBus } from '@/lib/aggregates/event-bus'

export function createDashboardAggregate(eventId, client, options = {}) {
  const eventBus = createEventBus()
  const dashboard = createDashboardModule(client, eventBus)

  return {
    eventId,
    dashboard,
    eventBus,
    async loadAll(params = {}) {
      // Dashboard aggregate only loads stats
      if (eventId) {
        await dashboard.stats(eventId)
      }
    },
  }
}
