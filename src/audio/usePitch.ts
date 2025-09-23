import { useEffect, useState } from "react";
import { centsOff, noteNameFromNumber } from "../utils/noteMath";

type PitchState = {
  hz: number;
  confidence: number;
  note?: string;
  cents?: number;
};

export function usePitch(
  audioCtx: AudioContext | null,
  source: MediaStreamAudioSourceNode | null,
  a4 = 440,
) {
  const [state, setState] = useState<PitchState>({ hz: 0, confidence: 0 });

  useEffect(() => {
    let mounted = true;
    let node: AudioWorkletNode | null = null;

    async function setup() {
      if (!audioCtx || !source) return;
      // Load worklet module; Vite bundles via URL
      await audioCtx.audioWorklet.addModule(
        new URL("./worklets/pitch-processor.js", import.meta.url),
      );
      if (!mounted) return;
      node = new AudioWorkletNode(audioCtx, "pitch-processor");
      source.connect(node);
      node.port.onmessage = (e: MessageEvent) => {
        if (!mounted) return;
        const { hz, confidence } = e.data as { hz: number; confidence: number };
        if (hz > 0 && confidence > 0.6) {
          const { cents, nearest } = centsOff(hz, a4);
          const note = noteNameFromNumber(nearest);
          setState({ hz, confidence, note, cents });
        } else {
          setState((s) => ({
            ...s,
            confidence: Math.max(0, confidence ?? 0),
            hz: 0,
            note: undefined,
            cents: undefined,
          }));
        }
      };
    }

    setup().catch((err) => {
      // Non-fatal: keep app running even if worklet fails to load
      console.warn("Pitch worklet load failed:", err);
    });

    return () => {
      mounted = false;
      try {
        node?.port.close();
        node?.disconnect();
      } catch {
        // noop
      }
      node = null;
    };
  }, [audioCtx, source, a4]);

  return state;
}
