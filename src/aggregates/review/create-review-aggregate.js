import { createReviewModule } from './modules/create-review-module'
import { createEventBus } from '@/lib/aggregates/event-bus'

export function createReviewAggregate(eventId, client, options = {}) {
  const eventBus = createEventBus()
  const review = createReviewModule(client, eventBus)

  return {
    eventId,
    review,
    eventBus,
    async loadAll(params = {}) {
      if (eventId) {
        await review.listQueue(eventId, params)
      }
    },
  }
}
