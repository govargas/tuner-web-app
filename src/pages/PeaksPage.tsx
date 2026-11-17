export default function PeaksPage() {
  return (
    <section aria-labelledby="peaks-heading">
      <div className="display-bezel">
        <div className="vfd-glass">
          <div className="waveform-heading">
            <h2 id="peaks-heading">Waveforms</h2>
            <span>No audio loaded</span>
          </div>
          <div className="waveform-stage">
            <svg
              viewBox="0 0 600 120"
              preserveAspectRatio="none"
              role="img"
              aria-label="Empty waveform display"
            >
              <line className="waveform-grid" x1="0" y1="30" x2="600" y2="30" />
              <line className="waveform-grid" x1="0" y1="90" x2="600" y2="90" />
              <path className="waveform-line" d="M0,60 L600,60" fill="none" strokeWidth="1" />
            </svg>
          </div>
          <p className="waveform-empty">The waveform display is still in the workshop.</p>
        </div>
      </div>
      <div className="waveform-controls">
        <div>
          <p>Audio file inspection isn’t available yet. The tuner is ready whenever you are.</p>
          <span className="control-detail">
            Use the Tuner selector above to tune with your microphone.
          </span>
        </div>
        <button type="button" className="power-button waveform-upload" disabled>
          Upload audio
        </button>
      </div>
    </section>
  )
}
