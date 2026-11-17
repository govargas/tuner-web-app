import { useEffect, useState } from 'react'
import { useAudioGraph } from '../audio/useAudioGraph'
import { usePitch } from '../audio/usePitch'
import A4Control from '../components/A4Control'
import DeviceSelect from '../components/DeviceSelect'
import { useAppStore } from '../state/useAppStore'

const SEGMENTS = 41
const CENTER = (SEGMENTS - 1) / 2

export default function TunerPage() {
  const a4 = useAppStore((s) => s.a4)
  const deviceId = useAppStore((s) => s.deviceId)
  const { start, stop, running, starting, error, analyser, audioCtx, source } =
    useAudioGraph(deviceId)
  const [rms, setRms] = useState(0)
  const pitch = usePitch(audioCtx, source, a4)

  useEffect(() => {
    if (!analyser) return
    const buf = new Float32Array(analyser.fftSize)
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      if (now - last >= 50) {
        analyser.getFloatTimeDomainData(buf)
        let sum = 0
        for (const sample of buf) sum += sample * sample
        setRms(Math.sqrt(sum / buf.length))
        last = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [analyser])

  const hasSignal = running && pitch.note != null && pitch.cents != null
  const cents = hasSignal ? pitch.cents! : 0
  const inTune = hasSignal && Math.abs(cents) <= 5
  const pointer = Math.max(
    0,
    Math.min(SEGMENTS - 1, Math.round(((cents + 50) / 100) * (SEGMENTS - 1))),
  )
  const activeSegments = running ? Math.round(Math.min(1, rms * 5) * 20) : 0
  const note = hasSignal ? pitch.note!.replace(/-?\d+$/, '') : '-'
  const octave = hasSignal ? pitch.note!.match(/-?\d+$/)?.[0] : '-'
  const status = !running
    ? 'Standby'
    : !hasSignal
      ? 'Listening'
      : inTune
        ? 'In tune'
        : cents < 0
          ? 'Tune up'
          : 'Tune down'

  return (
    <section aria-label="Chromatic tuner">
      <div className={`display-bezel ${running ? 'is-running' : ''}`}>
        <div className="vfd-glass" role="group" aria-label="Pitch display">
          <div className="display-topline">
            <span>Pitch / frequency</span>
            <span className="display-status" role="status">
              <i className={running ? 'status-lamp on' : 'status-lamp'} />
              {starting ? 'Connecting' : status}
            </span>
          </div>
          <div className="display-readings" aria-hidden="true">
            <div className="note-reading">
              <div className="segment-readout note-digit">
                <span className="ghost">8</span>
                <span className="phosphor">{note}</span>
              </div>
              <div className="octave-reading">
                <span className="display-label">Octave</span>
                <span className="octave-digit phosphor">{octave}</span>
              </div>
            </div>
            <div className="frequency-reading">
              <span className="display-label">Frequency</span>
              <div className="frequency-line">
                <div className="segment-readout frequency-digit">
                  <span className="ghost">8888.8</span>
                  <span className="phosphor">{hasSignal ? pitch.hz.toFixed(1) : '----.-'}</span>
                </div>
                <span className="frequency-unit">Hz</span>
              </div>
            </div>
          </div>
          <p className="sr-only">
            {hasSignal
              ? `${pitch.note}, ${pitch.hz.toFixed(1)} hertz, ${Math.round(cents)} cents`
              : running
                ? 'Play a note to measure its pitch.'
                : 'Microphone off.'}
          </p>
          <div className="tuning-scale">
            <span>-50</span>
            <span>-25</span>
            <span className="scale-zero">0</span>
            <span>+25</span>
            <span>+50</span>
          </div>
          <div
            className="tuning-meter"
            role="meter"
            aria-valuemin={-50}
            aria-valuemax={50}
            aria-valuenow={Math.round(cents)}
            aria-valuetext={hasSignal ? `${Math.round(cents)} cents` : 'No signal'}
            aria-label="Cents from target pitch"
          >
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <span
                key={i}
                className={`tuning-segment ${i === CENTER ? 'center' : ''} ${hasSignal && (i === pointer || (inTune && i === CENTER)) ? 'lit' : ''}`}
              />
            ))}
          </div>
          <div className="scale-legends">
            <span>Flat</span>
            <span>{hasSignal ? `${cents > 0 ? '+' : ''}${Math.round(cents)} cents` : 'Cents'}</span>
            <span>Sharp</span>
          </div>
          <div className="display-bottomline">
            <span>
              Reference <b>{a4}</b> Hz
            </span>
            <div className="level-group">
              <span>Input</span>
              <div
                className="level-meter"
                role="meter"
                aria-label="Input level"
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={running ? Math.min(1, rms) : 0}
              >
                {Array.from({ length: 20 }, (_, i) => (
                  <span
                    key={i}
                    className={`${i < activeSegments ? 'lit' : ''} ${i > 16 ? 'peak' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="control-rail">
        <div className="power-control">
          <span className="control-label">Microphone</span>
          <button
            className="power-button"
            onClick={running ? stop : start}
            disabled={starting}
            aria-pressed={running}
            aria-label={running ? 'Stop mic' : 'Start mic'}
          >
            <span className={`power-lamp ${running ? 'on' : ''}`} />
            {starting ? 'Wait' : running ? 'On' : 'Off'}
          </button>
          <span className="control-detail">Push on / off</span>
        </div>
        <DeviceSelect running={running} />
        <A4Control />
      </div>
      <div className="operating-note" role={error ? 'alert' : undefined}>
        <span className="note-marker" aria-hidden="true" />
        {error ||
          (running
            ? 'Play one note and let it ring. Adjust your tuning until the indicator is centred at 0.'
            : 'Switch on the microphone, then play a note. Adjust your tuning until the indicator is centred at 0.')}
      </div>
    </section>
  )
}
