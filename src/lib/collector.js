'use strict'

/**
 * Collector - Utility for collecting data from multiple async sources
 * 
 * Features:
 * - Single-flight pattern (waits for all keys before resolving)
 * - Timeout support via AbortSignal
 * - Validation of collected data
 * - Default values for missing data
 * - Strict/exact key checking
 * - Reassign protection
 * 
 * @example
 * const collector = collect(['user', 'posts'], { timeout: 5000 })
 * collector.wait('user', () => fetchUser())
 * collector.wait('posts', () => fetchPosts())
 * const data = await collector // { user: {...}, posts: [...] }
 */

class Collector {
	done = false
	data = {}
	keys = []
	count = 0
	exact = true
	reassign = true
	timeout = 0
	defaults = {}
	validate = null
	softFail = false

	#fulfill = null
	#reject = null
	#cause = null
	#controller = null
	#signal = null
	#timeoutSignal = null

	constructor(keys, options = {}) {
		const { exact = true, reassign = false } = options
		const { timeout = 0, defaults = {}, validate, softFail = false } = options

		if (validate) this.validate = validate
		this.keys = keys
		if (exact === false) this.exact = false
		if (reassign === false) this.reassign = reassign
		if (typeof defaults === 'object') this.defaults = defaults
		if (softFail === true) this.softFail = true

		this.#controller = new AbortController()
		this.#signal = this.#controller.signal

		if (typeof timeout === 'number' && timeout > 0) {
			this.#timeoutSignal = AbortSignal.timeout(timeout)
			this.#signal = AbortSignal.any([this.#signal, this.#timeoutSignal])
			this.#signal.addEventListener('abort', () => {
				if (this.done) return
				if (this.softFail) {
					this.#softResolve()
					return
				}
				if (Object.keys(this.defaults).length > 0) this.#default()
				this.fail(this.#signal.reason)
			})
		}
	}

	#default() {
		for (const [key, value] of Object.entries(this.defaults)) {
			if (this.data[key] === undefined) this.set(key, value)
		}
	}

	#softResolve() {
		for (const key of this.keys) {
			if (this.data[key] !== undefined) continue
			if (Object.prototype.hasOwnProperty.call(this.defaults, key)) {
				this.set(key, this.defaults[key])
			} else {
				this.set(key, undefined)
			}
		}
	}

	get signal() {
		return this.#signal
	}

	set(key, value) {
		if (this.done) return

		const expected = this.keys.includes(key)
		if (!expected && this.exact) {
			this.fail(new Error('Unexpected key: ' + key))
			return
		}

		const has = this.data[key] !== undefined
		if (has && !this.reassign) {
			const error = new Error('Collector reassign mode is off')
			return void this.fail(error)
		}

		if (!has && expected) this.count++
		this.data[key] = value

		if (this.count === this.keys.length) {
			this.done = true
			this.#timeoutSignal = null

			// Валидация перед резолвом
			if (this.validate) {
				try {
					this.validate(this.data)
				} catch (err) {
					this.fail(err)
					return
				}
			}

			if (this.#fulfill) this.#fulfill(this.data)
		}
	}

	take(key, fn, ...args) {
		if (this.done) return
		
		fn(...args, (err, data) => {
			if (this.done) return // Защита от поздних callbacks
			if (err) {
				if (this.softFail) {
					if (Object.prototype.hasOwnProperty.call(this.defaults, key)) {
						return this.set(key, this.defaults[key])
					}
					return this.set(key, undefined)
				}
				this.fail(err)
				return
			}
			else this.set(key, data)
		})
	}

	wait(key, fn, ...args) {
		if (this.done) return // Защита
		
		const promise = fn instanceof Promise ? fn : Promise.resolve().then(() => fn(...args))
		promise.then(
			(data) => this.set(key, data),
			(err) => {
				if (this.softFail) {
					if (Object.prototype.hasOwnProperty.call(this.defaults, key)) {
						this.set(key, this.defaults[key])
						return
					}
					this.set(key, undefined)
					return
				}
				this.fail(err)
			},
		)
	}

	collect(sources) {
		if (this.done) return // Защита
		
		for (const [key, collector] of Object.entries(sources)) {
			if (!(collector instanceof Promise)) {
				const err = new Error(`Collector for key "${key}" is not a Promise`)
				if (this.softFail) {
					if (Object.prototype.hasOwnProperty.call(this.defaults, key)) {
						this.set(key, this.defaults[key])
						continue
					}
					this.set(key, undefined)
					continue
				}
				this.fail(err)
				return
			}
			collector.then(
				(data) => this.set(key, data),
				(err) => {
					if (this.softFail) {
						if (Object.prototype.hasOwnProperty.call(this.defaults, key)) {
							this.set(key, this.defaults[key])
							return
						}
						this.set(key, undefined)
						return
					}
					this.fail(err)
				},
			)
		}
	}

	fail(error) {
		if (this.done) return // Защита от повторных вызовов
		
		this.done = true
		this.#timeoutSignal = null
		const err = error || new Error('Collector aborted')
		this.#cause = err
		this.#controller.abort()
		if (this.#reject) this.#reject(err)
	}

	abort() {
		this.fail()
	}

	then(onFulfilled, onRejected = null) {
		return new Promise((resolve, reject) => {
			this.#fulfill = resolve
			this.#reject = reject
			
			// Если уже done, резолвим сразу
			if (this.done) {
				if (this.#cause) return reject(this.#cause)
				return resolve(this.data)
			}
		}).then(onFulfilled, onRejected)
	}
}

/**
 * Create a new Collector instance
 * @param {string[]} keys - Array of keys to collect
 * @param {Object} options - Collector options
 * @param {boolean} options.exact - Strict key checking (default: true)
 * @param {boolean} options.reassign - Allow reassigning values (default: false)
 * @param {number} options.timeout - Timeout in milliseconds (default: 0 = no timeout)
 * @param {Object} options.defaults - Default values for keys
 * @param {Function} options.validate - Validation function (data) => void
 * @param {boolean} options.softFail - Use defaults on error instead of rejecting
 * @returns {Collector} Collector instance
 * 
 * @example
 * const collector = collect(['user', 'posts'], {
 *   timeout: 5000,
 *   defaults: { user: null },
 *   validate: (data) => {
 *     if (!data.user) throw new Error('User required')
 *   }
 * })
 */
const collect = (keys, options) => new Collector(keys, options)

export { Collector, collect }

