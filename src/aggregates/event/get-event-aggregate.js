import { createEventAggregate } from './create-event-aggregate'

const cache = new Map()
const DEFAULT_TTL = 5 * 60 * 1000
const DEFAULT_MAX = 50

const buildKey = (eventId, options = {}) => {
  const originType = options.originType || 'default'
  const shuttleType = options.shuttleType || 'default'
  const scope = eventId || 'list'
  return `${scope}:${originType}:${shuttleType}`
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

export function getEventAggregate(eventId, client, options = {}) {
  const key = buildKey(eventId, options)
  const cached = cache.get(key)
  if (cached && cached.client === client) {
    cached.lastAccess = Date.now()
    return cached.aggregate
  }

  const aggregate = createEventAggregate(eventId, client, options)
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

export function clearEventAggregate(eventId, options = {}) {
  if (!eventId) {
    cache.clear()
    return
  }

  if (options.originType || options.shuttleType) {
    cache.delete(buildKey(eventId, options))
    return
  }

  for (const key of cache.keys()) {
    if (key.startsWith(`${eventId}:`)) cache.delete(key)
  }
}
