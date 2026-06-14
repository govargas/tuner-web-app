import { lazy, Suspense, useEffect, useState } from 'react'
import { useAudioGraph } from '../audio/useAudioGraph'
import { usePitch } from '../audio/usePitch'
import A4Control from '../components/A4Control'
import DeviceSelect from '../components/DeviceSelect'
import { useAppStore } from '../state/useAppStore'
import { useToastStore } from '../state/useToastStore'

// three.js is heavy; code-split it so the page shell paints first.
const InstrumentCanvas = lazy(() => import('../three/InstrumentCanvas'))

export default function TunerPage() {
  const a4 = useAppStore((s) => s.a4)
  const setA4 = useAppStore((s) => s.setA4)
  const deviceId = useAppStore((s) => s.deviceId)
  const { start, stop, running, ready, analyser, audioCtx, source } = useAudioGraph(deviceId)
  const [rms, setRms] = useState(0)
  const pitch = usePitch(audioCtx, source, a4)

  const totalSegments = 28
  const rmsNormalized = Math.min(1, rms * 5)
  const activeSegments = Math.round(rmsNormalized * totalSegments)

  useEffect(() => {
    if (!ready || !analyser) return
    const buf = new Float32Array(analyser.fftSize)
    let raf = 0
    const tick = () => {
      analyser.getFloatTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
      setRms(Math.sqrt(sum / buf.length))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ready, analyser])

  const hasSignal = pitch.cents != null && pitch.note != null
  const cents = pitch.cents ?? 0
  const liveText = hasSignal
    ? `${pitch.note}, ${pitch.hz?.toFixed(1)} hertz, ${cents > 0 ? 'plus ' : cents < 0 ? 'minus ' : ''}${Math.abs(
        Math.round(cents),
      )} cents`
    : running
      ? 'Listening, no pitch detected'
      : 'Microphone off'

  return (
    <div>
      <section aria-labelledby="tuner-heading" className="instrument">
        <h2 id="tuner-heading" className="sr-only">
          Tuner
        </h2>
        <h3 id="pitch-heading" className="sr-only">
          Pitch readout
        </h3>

        <Suspense
          fallback={
            <div
              className="metal"
              aria-hidden="true"
              style={{ width: '100%', aspectRatio: '12 / 3.9', borderRadius: '14px' }}
            />
          }
        >
          <InstrumentCanvas
            running={running}
            note={pitch.note}
            hz={pitch.hz}
            cents={pitch.cents}
            confidence={pitch.confidence}
            rms={rms}
            a4={a4}
            onA4Change={setA4}
          />
        </Suspense>

        <p className="sr-only" role="status" aria-live="polite" aria-labelledby="pitch-heading">
          {liveText}
        </p>

        <div className="control-bar metal">
          <span className="caption">
            {running
              ? 'Detecting pitch. Drag the A4 knob or use Reference pitch to recalibrate.'
              : 'Activate the microphone to begin real-time pitch detection.'}
          </span>
          {!running ? (
            <button onClick={start} className="btn-primary">
              Start mic
            </button>
          ) : (
            <button onClick={stop} className="btn-primary btn-danger">
              Stop mic
            </button>
          )}
        </div>
      </section>

      <div className="panel-grid">
        <section className="panel metal" aria-labelledby="input-heading">
          <h3 id="input-heading" className="panel-title">
            Input level (RMS)
          </h3>
          <div
            className="meter-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={rms}
            aria-label="Input level meter"
          >
            {Array.from({ length: totalSegments }).map((_, idx) => {
              const lit = idx < activeSegments
              const isWarning = idx >= totalSegments - 5 && idx < totalSegments - 2
              const isDanger = idx >= totalSegments - 2
              return (
                <div
                  key={idx}
                  className={`meter-segment ${lit ? 'lit' : ''} ${
                    isDanger ? 'danger' : isWarning ? 'warn' : ''
                  }`}
                />
              )
            })}
          </div>
          <div className="small-label mt-3">
            <span>RMS</span>
            <span className="readout-value">{rms.toFixed(3)}</span>
            <span>Peak</span>
          </div>
        </section>

        <A4Control />

        <DeviceSelect
          onAfterPermission={() => {
            useToastStore.getState().push('Device labels updated')
          }}
        />
      </div>
    </div>
  )
}
