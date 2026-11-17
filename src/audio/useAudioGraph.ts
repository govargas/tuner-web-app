import { useCallback, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
type Graph = { audioCtx: AudioContext; source: MediaStreamAudioSourceNode; analyser: AnalyserNode }

export function useAudioGraph(deviceId?: string) {
  const resources = useRef<Graph | null>(null)
  const pendingContext = useRef<AudioContext | null>(null)
  const generation = useRef(0)
  const wanted = useRef(false)
  const selectedDevice = useRef(deviceId)
  const [graph, setGraph] = useState<Graph | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  const release = useCallback(() => {
    const old = resources.current
    resources.current = null
    const pending = pendingContext.current
    pendingContext.current = null
    if (pending && pending.state !== 'closed') void pending.close().catch(() => {})
    if (!old) return
    old.source.mediaStream.getTracks().forEach((track) => track.stop())
    old.source.disconnect()
    if (old.audioCtx.state !== 'closed') void old.audioCtx.close().catch(() => {})
  }, [])

  const stop = useCallback(() => {
    wanted.current = false
    generation.current++
    release()
    setGraph(null)
    setStarting(false)
  }, [release])

  const start = useCallback(async () => {
    if (wanted.current) return
    wanted.current = true
    const request = ++generation.current
    setStarting(true)
    setError('')
    let stream: MediaStream | undefined
    let ctx: AudioContext | undefined
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext
      if (!Ctor || !navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
      ctx = new Ctor()
      pendingContext.current = ctx
      await ctx.resume()
      if (request !== generation.current) return
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDevice.current ? { exact: selectedDevice.current } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      if (request !== generation.current) {
        stream.getTracks().forEach((track) => track.stop())
        if (ctx.state !== 'closed') await ctx.close()
        return
      }
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      const next = { audioCtx: ctx, source, analyser }
      pendingContext.current = null
      resources.current = next
      setGraph(next)
    } catch (cause) {
      stream?.getTracks().forEach((track) => track.stop())
      if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {})
      if (request !== generation.current) return
      wanted.current = false
      const name = cause instanceof Error ? cause.name : ''
      setError(
        name === 'NotAllowedError'
          ? 'Microphone access is blocked. Allow it in your browser, then switch on again.'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? 'That microphone is unavailable. Select another input and switch on again.'
            : name === 'NotReadableError'
              ? 'The microphone is busy. Close other apps using it, then try again.'
              : 'Microphone unavailable. Open this page in a browser with microphone support and try again.',
      )
    } finally {
      if (pendingContext.current === ctx) pendingContext.current = null
      if (request === generation.current) setStarting(false)
    }
  }, [])

  useEffect(() => {
    if (selectedDevice.current === deviceId) return
    selectedDevice.current = deviceId
    if (wanted.current) {
      stop()
      void start()
    }
  }, [deviceId, start, stop])

  useEffect(
    () => () => {
      wanted.current = false
      generation.current++
      release()
    },
    [release],
  )

  return {
    start,
    stop,
    running: graph !== null,
    starting,
    error,
    audioCtx: graph?.audioCtx ?? null,
    source: graph?.source ?? null,
    analyser: graph?.analyser ?? null,
  }
}
