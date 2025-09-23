// src/pages/PeaksPage.tsx
export default function PeaksPage() {
  return (
    <section
      aria-labelledby="peaks-heading"
      className="rounded-2xl p-6 bg-neutral-950/60 ring-1 ring-neutral-800"
    >
      <h2 id="peaks-heading" className="text-lg font-medium text-cyan-200">
        Waveforms
      </h2>
      <p className="mt-2 text-cyan-300/90">
        Uploads and waveform peaks (React Query + Go backend) will be shown
        here.
      </p>
    </section>
  );
}
