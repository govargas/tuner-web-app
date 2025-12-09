import { useEffect, useState } from 'react'
import { useAudioGraph } from '../audio/useAudioGraph'
import { usePitch } from '../audio/usePitch'
import A4Control from '../components/A4Control'
import DeviceSelect from '../components/DeviceSelect'
import { useAppStore } from '../state/useAppStore'
import { useToastStore } from '../state/useToastStore'

export default function TunerPage() {
  const a4 = useAppStore((s) => s.a4)
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

  const cents = pitch.cents ?? 0
  const centsPct = Math.max(0, Math.min(100, ((cents + 50) / 100) * 100))
  const confidencePct = Math.max(0, Math.min(100, Math.round((pitch.confidence ?? 0) * 100)))

  return (
    <div className="space-y-6">
      <section aria-labelledby="tuner-heading" className="panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="tuner-heading" className="panel-title">
            Tuner
          </h2>
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
        <p className="caption mt-2">
          Activate the microphone to begin real-time pitch detection. The UI mirrors classic VFD
          tuner hardware with clear focus outlines for keyboard navigation.
        </p>
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
                  className={`meter-segment ${lit ? 'lit' : ''} ${isDanger ? 'danger' : isWarning ? 'warn' : ''}`}
                />
              )
            })}
          </div>
          <div className="small-label mt-3">
            <span>RMS</span>
            <span>dB</span>
            <span>+50</span>
          </div>
          <p className="caption mt-2">RMS: {rms.toFixed(3)}</p>
        </section>

        <section className="panel" aria-labelledby="pitch-heading">
          <div className="flex items-start justify-between">
            <h3 id="pitch-heading" className="panel-title">
              Pitch (A4 = {a4} Hz)
            </h3>
            <div className="h-1 w-16 rounded-full bg-[rgba(111,243,255,0.4)] shadow-[0_0_10px_rgba(111,243,255,0.55)]" />
          </div>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="vfd-note min-w-[6ch] tabular-nums">{pitch.note ?? '—'}</div>
              <p className="vfd-freq tabular-nums">
                {pitch.hz ? `${pitch.hz.toFixed(1)} Hz` : '000.0 Hz'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-[0.8rem] text-[var(--text-secondary)] mb-2">
              <span>−50¢</span>
              <span>In tune</span>
              <span>+50¢</span>
            </div>
            <div
              className="tuning-track"
              role="meter"
              aria-valuemin={-50}
              aria-valuemax={50}
              aria-valuenow={cents}
            >
              <div className="tuning-thumb" style={{ left: `${centsPct}%` }} />
            </div>
          </div>

          <p className="caption mt-3">Confidence: {confidencePct}%</p>
        </section>
      </div>

      <div className="panel-grid">
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
