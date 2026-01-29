import { createReviewAggregate } from './create-review-aggregate'

const cache = new Map()
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
const DEFAULT_MAX = 50

const buildKey = (eventId) => {
  return `review:${eventId || 'global'}`
}

const cleanup = () => {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (now - entry.createdAt > entry.ttl) {
      cache.delete(key)
    }
  }
  if (cache.size <= DEFAULT_MAX) return
  const sorted = [...cache.entries()].sort((a, b) => a[1].lastAccess - b[1].lastAccess)
  const overflow = cache.size - DEFAULT_MAX
  for (let i = 0; i < overflow; i += 1) {
    cache.delete(sorted[i][0])
  }
}

if (typeof window !== 'undefined') {
  setInterval(cleanup, 60 * 1000)
}

export function getReviewAggregate(eventId, client, options = {}) {
  if (!eventId) {
    throw new Error('Event ID is required for review aggregate')
  }

  const key = buildKey(eventId)
  const cached = cache.get(key)
  if (cached && cached.client === client) {
    cached.lastAccess = Date.now()
    return cached.aggregate
  }

  const aggregate = createReviewAggregate(eventId, client, options)
  cache.set(key, {
    aggregate,
    client,
    createdAt: Date.now(),
    lastAccess: Date.now(),
    ttl: options.ttl || DEFAULT_TTL,
  })
  cleanup()
  return aggregate
}

export function clearReviewAggregate(eventId) {
  if (!eventId) {
    cache.clear()
    return
  }

  const key = buildKey(eventId)
  cache.delete(key)
}
