import { useId } from 'react'
import { useAppStore } from '../state/useAppStore'

export default function A4Control() {
  const sliderId = useId()
  const inputId = useId()
  const a4 = useAppStore((s) => s.a4)
  const setA4 = useAppStore((s) => s.setA4)

  return (
    <fieldset className="panel">
      <legend className="panel-title">Reference pitch</legend>
      <div className="form-shell sm:grid-cols-[1fr_auto] sm:items-center">
        <label htmlFor={sliderId} className="sr-only">
          A4 reference (Hz)
        </label>
        <input
          id={sliderId}
          type="range"
          min={432}
          max={446}
          value={a4}
          onChange={(e) => setA4(Number(e.currentTarget.value))}
          aria-valuemin={432}
          aria-valuemax={446}
          aria-valuenow={a4}
          aria-label="A4 reference, Hertz"
          className="input-control"
        />
        <div className="input-shell">
          <label htmlFor={inputId} className="input-label">
            A4 (Hz)
          </label>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={432}
            max={446}
            value={a4}
            onChange={(e) => setA4(Number(e.currentTarget.value))}
            className="input-control"
            style={{ maxWidth: '96px' }}
          />
        </div>
      </div>
      <p className="caption mt-2">
        Sets the tuning standard for note calculations (range 432–446 Hz).
      </p>
    </fieldset>
  )
}
