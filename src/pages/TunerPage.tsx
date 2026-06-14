import { useEffect, useRef, useState } from 'react'
import { useAudioGraph } from '../audio/useAudioGraph'
import { usePitch } from '../audio/usePitch'
import A4Control from '../components/A4Control'
import DeviceSelect from '../components/DeviceSelect'
import { useAppStore } from '../state/useAppStore'
import { useToastStore } from '../state/useToastStore'

// Cents strobe: odd count so there is a true center segment at 0 cents.
const STROBE_SEGMENTS = 41
const STROBE_CENTER = (STROBE_SEGMENTS - 1) / 2

export default function TunerPage() {
  const a4 = useAppStore((s) => s.a4)
  const deviceId = useAppStore((s) => s.deviceId)
  const { start, stop, running, ready, analyser, audioCtx, source } = useAudioGraph(deviceId)
  const [rms, setRms] = useState(0)
  const pitch = usePitch(audioCtx, source, a4)

  const totalSegments = 28
  const rmsNormalized = Math.min(1, rms * 5)
  const activeSegments = Math.round(rmsNormalized * totalSegments)

  // Power-on sweep when the mic engages (motion: state transition feedback).
  const [powerOn, setPowerOn] = useState(false)
  const prevRunning = useRef(running)
  useEffect(() => {
    if (running && !prevRunning.current) {
      setPowerOn(true)
      const t = setTimeout(() => setPowerOn(false), 700)
      prevRunning.current = running
      return () => clearTimeout(t)
    }
    prevRunning.current = running
  }, [running])

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
  const confidencePct = Math.max(0, Math.min(100, Math.round((pitch.confidence ?? 0) * 100)))

  // Which strobe segment the current cents value points at.
  const pointer = Math.round(((cents + 50) / 100) * (STROBE_SEGMENTS - 1))
  const inTune = hasSignal && Math.abs(cents) <= 5

  return (
    <div>
      <section
        aria-labelledby="tuner-heading"
        className={`instrument ${powerOn ? 'vfd-power' : ''}`}
      >
        <div className="instrument-head">
          <div className="flex items-baseline gap-3">
            <h2 id="tuner-heading" className="instrument-label">
              Tuner
            </h2>
            <span className="caption">Real-time pitch detection</span>
          </div>
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

        <div
          className={`vfd-glass ${hasSignal ? '' : 'vfd-idle'}`}
          role="group"
          aria-labelledby="pitch-heading"
        >
          <div className="display-status">
            <span id="pitch-heading">Pitch · A4 {a4} Hz</span>
            <span className={running ? 'live' : ''}>
              {running ? (inTune ? 'In tune' : 'Listening') : 'Standby'}
            </span>
          </div>

          <div className="mt-7 flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-center sm:gap-10">
            <div className="readout vfd-note" aria-hidden="true">
              <span className="ghost">~~~</span>
              <span className="live">{pitch.note ?? ''}</span>
            </div>
            <div className="flex items-end" aria-hidden="true">
              <div className="readout vfd-freq">
                <span className="ghost">888.8</span>
                <span className="live">{pitch.hz ? pitch.hz.toFixed(1) : ''}</span>
              </div>
              <span className="freq-unit">Hz</span>
            </div>
            <span className="sr-only" aria-live="polite">
              {hasSignal
                ? `${pitch.note}, ${pitch.hz?.toFixed(1)} hertz, ${cents > 0 ? '+' : ''}${Math.round(
                    cents,
                  )} cents`
                : 'No signal'}
            </span>
          </div>

          <div className="mt-8">
            <div className="strobe-scale">
              <span>-50¢</span>
              <span className="center">0</span>
              <span>+50¢</span>
            </div>
            <div
              className="strobe"
              role="meter"
              aria-valuemin={-50}
              aria-valuemax={50}
              aria-valuenow={cents}
              aria-label="Cents from target pitch"
            >
              {Array.from({ length: STROBE_SEGMENTS }).map((_, idx) => {
                if (idx === STROBE_CENTER) return <div key={idx} className="strobe-seg center" />
                const on = hasSignal && idx === pointer
                const dist = Math.abs(idx - STROBE_CENTER)
                const near = on && dist <= 2
                const warn = on && dist >= 12
                return (
                  <div
                    key={idx}
                    className={`strobe-seg ${on ? 'on' : ''} ${near ? 'near' : ''} ${
                      warn ? 'warn' : ''
                    }`}
                  />
                )
              })}
            </div>
            <div className="small-label mt-2">
              <span>Flat</span>
              <span className="readout-value">{hasSignal ? `Conf ${confidencePct}%` : '--'}</span>
              <span>Sharp</span>
            </div>
          </div>
        </div>
      </section>

      <div className="panel-grid">
        <section className="panel" aria-labelledby="input-heading">
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
