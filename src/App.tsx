import { NavLink, Route, Routes } from 'react-router'
import TunerPage from './pages/TunerPage'
import PeaksPage from './pages/PeaksPage'
import ToastContainer from './components/ToastContainer'

export default function App() {
  return (
    <div className="app-surface">
      <a className="skip-link" href="#instrument">
        Skip to instrument
      </a>
      <div className="page-caption">
        <span>THE MUSIC'S IN YOU - JUST DON'T FORGET 2 TUNE IT UP A LIL' BIT :)</span>
        <span>No ads, no downloads, no BS.</span>
      </div>
      <main id="instrument" className="receiver">
        <div className="cabinet-top" aria-hidden="true">
          <div className="vents" />
        </div>
        <div className="faceplate">
          <span className="chassis-screw screw-left" aria-hidden="true" />
          <span className="chassis-screw screw-right" aria-hidden="true" />
          <header className="receiver-header">
            <div className="brand">
              <h1>TALO TUNER</h1>
              <div className="brand-description">
                Chromatic instrument tuner<span>Real-time pitch detection</span>
              </div>
            </div>
            <nav aria-label="Main" className="function-selector">
              <NavLink to="/" end>
                Tuner
              </NavLink>
              <NavLink to="/peaks">Waveforms</NavLink>
            </nav>
          </header>
          <Routes>
            <Route path="/" element={<TunerPage />} />
            <Route path="/peaks" element={<PeaksPage />} />
          </Routes>
          <div className="faceplate-foot" aria-hidden="true">
            <span>Direct microphone input</span>
            <span>Pitch / frequency / deviation</span>
          </div>
        </div>
        <div className="cabinet-bottom" aria-hidden="true" />
      </main>
      <footer className="page-footer">
        <p>Made for listening.</p>
        <p>Audio stays in your browser.</p>
      </footer>
      <ToastContainer />
    </div>
  )
}
