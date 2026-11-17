import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const compiled = ts.transpileModule(
  readFileSync(new URL('../src/audio/useAudioGraph.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText

// Exercise browser-resource ownership with deterministic permission promises.
function instrument(getUserMedia) {
  const slots = []
  const contexts = []
  let cursor = 0
  let effects = []
  const changed = (a, b) => !a || a.some((value, index) => value !== b[index])
  const hooks = {
    useRef(value) {
      const i = cursor++
      return (slots[i] ??= { current: value })
    },
    useState(value) {
      const i = cursor++
      slots[i] ??= { value }
      return [
        slots[i].value,
        (next) => {
          slots[i].value = typeof next === 'function' ? next(slots[i].value) : next
        },
      ]
    },
    useCallback(fn, deps) {
      const i = cursor++
      if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { fn, deps }
      return slots[i].fn
    },
    useEffect(fn, deps) {
      const i = cursor++
      if (!slots[i] || changed(slots[i].deps, deps)) {
        effects.push(() => {
          slots[i]?.cleanup?.()
          slots[i] = { deps, cleanup: fn() }
        })
      }
    },
  }
  class AudioContext {
    state = 'suspended'
    constructor() {
      contexts.push(this)
    }
    async resume() {
      this.state = 'running'
    }
    async close() {
      this.state = 'closed'
    }
    createMediaStreamSource(mediaStream) {
      return { mediaStream, connect() {}, disconnect() {} }
    }
    createAnalyser() {
      return {}
    }
  }
  const context = vm.createContext({
    exports: {},
    require: () => hooks,
    Error,
    window: { AudioContext },
    navigator: { mediaDevices: { getUserMedia } },
  })
  vm.runInContext(compiled, context)
  return {
    contexts,
    render(device) {
      cursor = 0
      const result = context.exports.useAudioGraph(device)
      const queued = effects
      effects = []
      queued.forEach((effect) => effect())
      return result
    },
    unmount() {
      slots.forEach((slot) => slot?.cleanup?.())
    },
  }
}
function microphone() {
  const track = {
    stopped: false,
    stop() {
      this.stopped = true
    },
  }
  return { track, getTracks: () => [track] }
}

test('stop releases every microphone track and the audio context', async () => {
  const stream = microphone()
  const app = instrument(async () => stream)
  await app.render().start()
  assert.equal(app.render().running, true)
  app.render().stop()
  assert.equal(app.render().running, false)
  assert.equal(stream.track.stopped, true)
  assert.equal(app.contexts[0].state, 'closed')
})

test('leaving the tuner releases the microphone', async () => {
  const stream = microphone()
  const app = instrument(async () => stream)
  await app.render().start()
  app.unmount()
  assert.equal(stream.track.stopped, true)
  assert.equal(app.contexts[0].state, 'closed')
})

test('a late permission result cannot restart a stopped tuner', async () => {
  let allow
  const stream = microphone()
  const permission = new Promise((resolve) => {
    allow = resolve
  })
  const app = instrument(() => permission)
  const starting = app.render().start()
  await new Promise((resolve) => setImmediate(resolve))
  app.render().stop()
  assert.equal(app.contexts[0].state, 'closed')
  allow(stream)
  await starting
  assert.equal(app.render().running, false)
  assert.equal(stream.track.stopped, true)
})

test('permission denial gives an actionable error and allows retry', async () => {
  const stream = microphone()
  let denied = true
  const app = instrument(async () => {
    if (denied) {
      const error = new Error('blocked')
      error.name = 'NotAllowedError'
      throw error
    }
    return stream
  })
  await app.render().start()
  assert.match(app.render().error, /Microphone access is blocked/)
  assert.equal(app.render().starting, false)
  denied = false
  await app.render().start()
  assert.equal(app.render().running, true)
  assert.equal(app.render().error, '')
  app.unmount()
})

test('changing input releases the old device before opening the new one', async () => {
  const streams = []
  const requests = []
  const app = instrument(async (options) => {
    const stream = microphone()
    streams.push(stream)
    requests.push(options)
    return stream
  })
  await app.render('first').start()
  app.render('second')
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(streams[0].track.stopped, true)
  assert.equal(app.contexts[0].state, 'closed')
  assert.equal(requests[1].audio.deviceId.exact, 'second')
  assert.equal(app.render('second').running, true)
  app.unmount()
})
