import { useId, type CSSProperties } from 'react'
import { useAppStore } from '../state/useAppStore'

export default function A4Control() {
  const id = useId()
  const a4 = useAppStore((s) => s.a4)
  const setA4 = useAppStore((s) => s.setA4)
  return (
    <fieldset className="reference-control">
      <legend className="control-label">Reference pitch</legend>
      <div className="reference-body">
        <div
          className="dial-assembly"
          style={{ '--dial-angle': `${-135 + ((a4 - 432) / 14) * 270}deg` } as CSSProperties}
        >
          <div className="dial-ticks" aria-hidden="true" />
          <div className="metal-dial" aria-hidden="true">
            <span />
          </div>
          <input
            className="dial-input"
            type="range"
            min={432}
            max={446}
            value={a4}
            onChange={(e) => setA4(Number(e.currentTarget.value))}
            aria-label="A4 reference, Hertz"
            aria-valuetext={`${a4} hertz. Use arrow keys to adjust.`}
          />
        </div>
        <div className="reference-value">
          <label htmlFor={id}>
            A4 <span>Hz</span>
          </label>
          <input
            id={id}
            aria-label="A4 (Hz)"
            type="number"
            min={432}
            max={446}
            key={a4}
            defaultValue={a4}
            onBlur={(e) => {
              if (e.currentTarget.value) setA4(Number(e.currentTarget.value))
              e.currentTarget.value = String(useAppStore.getState().a4)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') {
                e.currentTarget.value = String(a4)
                e.currentTarget.blur()
              }
            }}
          />
          <button className="text-button" onClick={() => setA4(440)} disabled={a4 === 440}>
            Reset 440
          </button>
        </div>
      </div>
      <span className="control-detail">432 - 446 Hz</span>
    </fieldset>
  )
}
