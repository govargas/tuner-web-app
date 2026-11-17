import { useEffect, useRef, useState } from 'react'
import { centsOff, noteNameFromNumber } from '../utils/noteMath'

type Measurement = { hz: number; confidence: number; source: MediaStreamAudioSourceNode | null }

export function usePitch(
  audioCtx: AudioContext | null,
  source: MediaStreamAudioSourceNode | null,
  a4 = 440,
) {
  const [measurement, setMeasurement] = useState<Measurement>({
    hz: 0,
    confidence: 0,
    source: null,
  })
  const loaded = useRef(new WeakMap<AudioContext, Promise<void>>())
  useEffect(() => {
    let mounted = true
    let node: AudioWorkletNode | null = null
    let mute: GainNode | null = null
    async function setup() {
      if (!audioCtx || !source) return
      let module = loaded.current.get(audioCtx)
      if (!module) {
        module = audioCtx.audioWorklet.addModule(
          new URL('./worklets/pitch-processor.js', import.meta.url),
        )
        loaded.current.set(audioCtx, module)
      }
      await module
      if (!mounted) return
      node = new AudioWorkletNode(audioCtx, 'pitch-processor')
      source.connect(node)
      // Pull the processor in every browser without monitoring the microphone.
      mute = audioCtx.createGain()
      mute.gain.value = 0
      node.connect(mute)
      mute.connect(audioCtx.destination)
      node.port.onmessage = (e: MessageEvent<{ hz: number; confidence: number }>) => {
        if (mounted) setMeasurement({ ...e.data, source })
      }
    }
    setup().catch((err) => {
      if (mounted) console.warn('Pitch detection unavailable:', err)
    })
    return () => {
      mounted = false
      if (node) {
        try {
          source?.disconnect(node)
        } catch {
          /* Source may already be disconnected. */
        }
        node.port.close()
        node.disconnect()
        mute?.disconnect()
      }
    }
  }, [audioCtx, source])
  const valid =
    source !== null &&
    measurement.source === source &&
    measurement.hz > 0 &&
    measurement.confidence > 0.6
  const hz = valid ? measurement.hz : 0
  const tuning = valid ? centsOff(hz, a4) : null
  return {
    hz,
    confidence: valid ? measurement.confidence : 0,
    note: tuning ? noteNameFromNumber(tuning.nearest) : undefined,
    cents: tuning?.cents,
  }
}
