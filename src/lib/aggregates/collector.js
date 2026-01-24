export function collect(keys, options = {}) {
  const {
    timeout = 20000,
    defaults = {},
    validate = null,
  } = options

  const pending = new Map()

  const wait = (key, fn) => {
    pending.set(key, fn)
  }

  const run = () => {
    const tasks = keys.map(async (key) => {
      const fn = pending.get(key)
      if (!fn) return [key, defaults[key]]
      try {
        const value = await fn()
        return [key, value]
      } catch (error) {
        return [key, defaults[key]]
      }
    })

    const timer = new Promise((resolve) => {
      setTimeout(() => resolve('timeout'), timeout)
    })

    return Promise.race([
      Promise.all(tasks).then((entries) => {
        const data = Object.fromEntries(entries)
        if (validate) validate(data)
        return data
      }),
      timer.then(() => {
        const data = {}
        keys.forEach((key) => {
          data[key] = defaults[key]
        })
        return data
      }),
    ])
  }

  return Object.assign(run(), { wait })
}
