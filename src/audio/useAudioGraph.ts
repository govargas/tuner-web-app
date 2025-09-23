import { useCallback, useRef, useState } from "react";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export function useAudioGraph() {
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);

  const start = useCallback(async () => {
    if (running) return;

    // 1) Request mic with processing disabled (better for pitch detection)
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch (err) {
      console.warn("Microphone permission or device error:", err);
      return;
    }

    // 2) Create/resume AudioContext (iOS may start as "suspended")
    const Ctor = window.AudioContext || window.webkitAudioContext!;
    const ctx = new Ctor();
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn("AudioContext resume failed:", err);
      }
    }

    // 3) Wire source → analyser
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);

    // 4) Publish refs + flags
    ctxRef.current = ctx;
    srcRef.current = src;
    analyserRef.current = analyser;
    setReady(true);
    setRunning(true);
  }, [running]);

  const stop = useCallback(() => {
    setRunning(false);
    setReady(false);

    // Stop media tracks (releases mic permission light)
    try {
      srcRef.current?.mediaStream.getTracks().forEach((t) => t.stop());
    } catch {
      /* noop */
    }

    // Close context
    try {
      ctxRef.current?.close();
    } catch {
      /* noop */
    }

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
