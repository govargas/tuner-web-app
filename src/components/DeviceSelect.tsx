import { useEffect, useId, useState } from 'react'
import { useAudioDevices } from '../audio/useAudioDevices'
import { useAppStore } from '../state/useAppStore'

export default function DeviceSelect({ running }: { running: boolean }) {
  const id = useId()
  const { inputs, refresh, supported } = useAudioDevices()
  const deviceId = useAppStore((s) => s.deviceId)
  const setDeviceId = useAppStore((s) => s.setDeviceId)
  const [error, setError] = useState('')
  useEffect(() => {
    refresh().catch(() => setError('Could not read inputs. Try Refresh.'))
  }, [running, refresh])
  return (
    <fieldset className="input-selector">
      <legend className="control-label">Input device</legend>
      <label className="sr-only" htmlFor={id}>
        Select microphone
      </label>
      <select
        id={id}
        className="device-select"
        aria-label="Microphone input device"
        disabled={!supported}
        value={deviceId ?? ''}
        onChange={(e) => setDeviceId(e.currentTarget.value || undefined)}
      >
        <option value="">System default</option>
        {inputs
          .filter((d) => d.deviceId)
          .map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
      </select>
      <div className="input-meta">
        <span className="control-detail">
          {error ||
            (!supported
              ? 'Microphone unavailable in this browser'
              : running
                ? 'Microphone connected'
                : 'Select your microphone or interface')}
        </span>
        <button
          className="text-button"
          disabled={!supported}
          onClick={() => {
            setError('')
            refresh().catch(() => setError('Could not read inputs. Try again.'))
          }}
        >
          Refresh
        </button>
      </div>
    </fieldset>
  )
}
