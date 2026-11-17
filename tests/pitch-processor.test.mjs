import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const context = vm.createContext({ AudioWorkletProcessor: class {}, registerProcessor() {} })
vm.runInContext(
  readFileSync(new URL('../src/audio/worklets/pitch-processor.js', import.meta.url), 'utf8'),
  context,
)
const detect = vm.runInContext('detectYIN', context)

for (const sampleRate of [44100, 48000, 96000]) {
  for (const frequency of [82.4069, 196, 440, 523.2511, 880]) {
    test(`${frequency} Hz at ${sampleRate} samples/s`, () => {
      const samples = Float32Array.from(
        { length: 2048 },
        (_, i) => 0.3 * Math.sin((2 * Math.PI * frequency * i) / sampleRate),
      )
      const result = detect(samples, sampleRate)
      const cents = 1200 * Math.log2(result.freq / frequency)
      assert.ok(Math.abs(cents) < 3, `Deviation: ${cents} cents`)
      assert.ok(result.conf > 0.9)
    })
  }
}
test('silence never lights a note', () => {
  const result = detect(new Float32Array(2048), 48000)
  assert.equal(result.freq, 0)
  assert.equal(result.conf, 0)
})
test('subthreshold input never lights a note', () => {
  const samples = Float32Array.from(
    { length: 2048 },
    (_, i) => 0.0001 * Math.sin((2 * Math.PI * 440 * i) / 48000),
  )
  assert.equal(detect(samples, 48000).freq, 0)
})
