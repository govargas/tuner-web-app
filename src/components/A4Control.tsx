import { useId } from 'react'
import { useAppStore } from '../state/useAppStore'

export default function A4Control() {
  const sliderId = useId()
  const inputId = useId()
  const a4 = useAppStore((s) => s.a4)
  const setA4 = useAppStore((s) => s.setA4)

  return (
    <fieldset className="rounded-xl p-4 bg-neutral-900 ring-1 ring-neutral-800">
      <legend className="text-sm text-cyan-200">Reference pitch</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
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
          className="w-full"
        />
        <div className="flex items-center gap-2">
          <label htmlFor={inputId} className="text-cyan-300/90 text-sm">
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
            className="w-20 rounded bg-neutral-950/60 ring-1 ring-neutral-700 px-2 py-1 text-cyan-200"
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-cyan-300/70">
        Sets the tuning standard for note calculations (range 432–446 Hz).
      </p>
    </fieldset>
  )
}
