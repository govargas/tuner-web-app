// src/pages/PeaksPage.tsx
// Idle baseline trace stands in for the live display surface until an upload
// pipeline (React Query + backend) is wired in. No fabricated peak data.
const BASELINE = 'M0,60 L600,60'
const IDLE_WAVE =
  'M0,60 C40,60 60,58 80,60 S140,62 160,60 S220,59 240,60 S300,61 320,60 S380,60 400,60 ' +
  'S460,61 480,60 S540,59 560,60 S600,60 600,60'

export default function PeaksPage() {
  return (
    <section aria-labelledby="peaks-heading" className="instrument" style={{ marginTop: '14px' }}>
      <div className="instrument-head">
        <div className="flex items-baseline gap-3">
          <h2 id="peaks-heading" className="instrument-label">
            Waveforms
          </h2>
          <span className="caption">Upload and inspect peak data</span>
        </div>
      </div>

      <div className="waveform-stage">
        <svg
          viewBox="0 0 600 120"
          preserveAspectRatio="none"
          role="img"
          aria-label="Idle waveform display, no signal loaded"
          style={{ width: '100%', height: '160px', display: 'block' }}
        >
          <line className="waveform-grid" x1="0" y1="30" x2="600" y2="30" strokeWidth="1" />
          <line className="waveform-grid" x1="0" y1="90" x2="600" y2="90" strokeWidth="1" />
          <path className="waveform-line" d={IDLE_WAVE} fill="none" strokeWidth="1.5" />
          <path className="waveform-line" d={BASELINE} fill="none" strokeWidth="0.75" opacity="0.4" />
        </svg>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="caption" style={{ maxWidth: '52ch' }}>
          No waveform loaded. Drop an audio file here to render its peaks against the same phosphor
          display the tuner uses.
        </p>
        <button type="button" className="btn-primary" disabled aria-disabled="true">
          Upload audio
        </button>
      </div>
    </section>
  )
}
