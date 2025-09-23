import { useEffect, useId } from 'react'
import { useAudioDevices } from '../audio/useAudioDevices'
import { useAppStore } from '../state/useAppStore'

export default function DeviceSelect({ onAfterPermission }: { onAfterPermission?: () => void }) {
  const selectId = useId()
  const { inputs, refresh, supported } = useAudioDevices()
  const deviceId = useAppStore((s) => s.deviceId)
  const setDeviceId = useAppStore((s) => s.setDeviceId)

  // Try to refresh labels after user has granted permission elsewhere
  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  const promptPermission = async () => {
    // Request a generic mic stream just to reveal device labels,
    // immediately stop tracks afterwards.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      await refresh()
      onAfterPermission?.()
    } catch (e) {
      console.warn('Permission request failed:', e)
    }
  }

  if (!supported) {
    return (
      <div className="rounded-xl p-4 bg-neutral-900 ring-1 ring-neutral-800">
        <p className="text-sm text-cyan-300/90">Device selection not supported in this browser.</p>
      </div>
    )
  }

  const showLabelsMissing = inputs.some(
    (d) => !d.label || d.label.toLowerCase().startsWith('microphone'),
  )

  return (
    <fieldset className="rounded-xl p-4 bg-neutral-900 ring-1 ring-neutral-800">
      <legend className="text-sm text-cyan-200">Input device</legend>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label htmlFor={selectId} className="sr-only">
            Select microphone
          </label>
          <select
            id={selectId}
            className="w-full rounded bg-neutral-950/60 ring-1 ring-neutral-700 px-2 py-2 text-cyan-200"
            value={deviceId ?? ''}
            onChange={(e) => setDeviceId(e.currentTarget.value || undefined)}
            aria-label="Microphone input device"
          >
            <option value="">System default</option>
            {inputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            className="px-3 py-2 rounded bg-cyan-500/20 ring-1 ring-cyan-400 hover:bg-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            Refresh
          </button>

          {showLabelsMissing && (
            <button
              type="button"
              onClick={promptPermission}
              className="px-3 py-2 rounded bg-amber-500/20 ring-1 ring-amber-400 hover:bg-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-300"
              aria-describedby="device-help"
            >
              Reveal labels
            </button>
          )}
        </div>
      </div>

      <p id="device-help" className="mt-2 text-xs text-cyan-300/70">
        If device labels look generic, click “Reveal labels” to grant mic permission so the browser
        can show exact names.
      </p>
    </fieldset>
  )
}
