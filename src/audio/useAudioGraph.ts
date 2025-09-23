import { useCallback, useRef, useState } from "react";

export function useAudioGraph() {
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);

  const start = useCallback(async () => {
    if (running) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);

    ctxRef.current = ctx;
    srcRef.current = src;
    analyserRef.current = analyser;
    setReady(true);
    setRunning(true);
  }, [running]);

  const stop = useCallback(() => {
    setRunning(false);
    setReady(false);
    const ctx = ctxRef.current;
    try {
      srcRef.current?.mediaStream.getTracks().forEach((t) => t.stop());
    } catch {
      /* noop */
    }
    ctx?.close();
    ctxRef.current = null;
    srcRef.current = null;
    analyserRef.current = null;
  }, []);

  return {
    start,
    stop,
    running,
    ready,
    audioCtx: ctxRef.current,
    source: srcRef.current,
    analyser: analyserRef.current,
  };
}
