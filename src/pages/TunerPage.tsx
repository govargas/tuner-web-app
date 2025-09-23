// src/pages/TunerPage.tsx
export default function TunerPage() {
  return (
    <section
      aria-labelledby="tuner-heading"
      className="rounded-2xl p-6 bg-neutral-950/60 ring-1 ring-neutral-800"
    >
      <h2 id="tuner-heading" className="text-lg font-medium text-cyan-200">
        Tuner
      </h2>
      <p className="mt-2 text-cyan-300/90">
        Live pitch detection UI will appear here (needle, note, frequency,
        meters).
      </p>
    </section>
  );
}
