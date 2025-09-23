import { useEffect, useState } from "react";
import { useAudioGraph } from "../audio/useAudioGraph";
import { usePitch } from "../audio/usePitch";

export default function TunerPage() {
  const { start, stop, running, ready, analyser, audioCtx, source } =
    useAudioGraph();
  const [rms, setRms] = useState(0);
  const pitch = usePitch(audioCtx, source); // default A4 = 440

  // Poll analyser for a simple RMS sanity check
  useEffect(() => {
    if (!ready || !analyser) return;
    const buf = new Float32Array(analyser.fftSize);
    let raf = 0;
    const tick = () => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      setRms(Math.sqrt(sum / buf.length));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, analyser]);

  const cents = pitch.cents ?? 0;
  const centsPct = Math.max(0, Math.min(100, ((cents + 50) / 100) * 100));

  return (
    <section
      aria-labelledby="tuner-heading"
      className="rounded-2xl p-6 bg-neutral-950/60 ring-1 ring-neutral-800"
    >
      <h2 id="tuner-heading" className="text-lg font-medium text-cyan-200">
        Tuner
      </h2>

      <div className="mt-4 flex gap-3">
        {!running ? (
          <button
            onClick={start}
            className="px-4 py-2 rounded bg-cyan-500/20 ring-1 ring-cyan-400 hover:bg-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            Start mic
          </button>
        ) : (
          <button
            onClick={stop}
            className="px-4 py-2 rounded bg-rose-500/20 ring-1 ring-rose-400 hover:bg-rose-500/30 focus:outline-none focus:ring-2 focus:ring-rose-300"
          >
            Stop mic
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Input level */}
        <div className="rounded-xl p-4 bg-neutral-900 ring-1 ring-neutral-800">
          <div className="text-sm text-cyan-300/90 mb-2">Input level (RMS)</div>
          <div
            className="h-3 bg-neutral-800 rounded"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={rms}
            aria-label="Input level meter"
          >
            <div
              className="h-3 rounded bg-cyan-400 transition-[width]"
              style={{ width: `${Math.min(100, rms * 400)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-cyan-300/70">RMS: {rms.toFixed(3)}</p>
        </div>

        {/* Pitch panel */}
        <div className="rounded-xl p-4 bg-neutral-900 ring-1 ring-neutral-800">
          <div className="text-sm text-cyan-300/90 mb-2">Pitch</div>

          <div className="flex items-end gap-4">
            <div className="text-6xl md:text-7xl font-bold tracking-widest text-cyan-400 tabular-nums min-w-[6ch]">
              {pitch.note ?? "—"}
            </div>
            <div className="text-xl text-cyan-300/90 tabular-nums">
              {pitch.hz ? `${pitch.hz.toFixed(1)} Hz` : "000.0 Hz"}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-cyan-300/70 mb-1">
              <span>−50¢</span>
              <span>In tune</span>
              <span>+50¢</span>
            </div>
            <div className="h-3 bg-neutral-800 rounded">
              <div
                className="h-3 rounded bg-cyan-400 transition-[width]"
                style={{ width: `${centsPct}%` }}
                role="meter"
                aria-valuemin={-50}
                aria-valuemax={50}
                aria-valuenow={Number.isFinite(cents) ? cents : 0}
                aria-label="Cents deviation"
              />
            </div>
          </div>

          <p className="mt-2 text-xs text-cyan-300/70">
            Confidence: {(pitch.confidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </section>
  );
}
