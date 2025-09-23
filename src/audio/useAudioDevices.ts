import { useCallback, useEffect, useState } from 'react'

export type AudioInput = { deviceId: string; label: string }

export function useAudioDevices() {
  const [inputs, setInputs] = useState<AudioInput[]>([])
  const [supported, setSupported] = useState<boolean>(false)

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    const devices = await navigator.mediaDevices.enumerateDevices()
    const inputs = devices
      .filter((d) => d.kind === 'audioinput')
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Microphone ${i + 1}`,
      }))
    setInputs(inputs)
  }, [])

  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.enumerateDevices)
    if (!supported) return
    // Initial load
    refresh().catch(() => {})

    // Refresh when devices change (e.g., plug audio interface)
    const onChange = () => refresh()
    navigator.mediaDevices.addEventListener?.('devicechange', onChange)
    return () => navigator.mediaDevices.removeEventListener?.('devicechange', onChange)
  }, [supported, refresh])

  return { inputs, refresh, supported }
}
