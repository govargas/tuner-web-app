// src/App.tsx
import { NavLink, Route, Routes } from 'react-router'
import TunerPage from './pages/TunerPage'
import PeaksPage from './pages/PeaksPage'
import ToastContainer from './components/ToastContainer'

export default function App() {
  return (
    <div className="app-surface">
      <header className="app-header">
        <div className="brand" aria-label="Tuner home">
          <span className="brand-led" aria-hidden="true" />
          <h1 className="brand-title">TUNER</h1>
        </div>
        <nav aria-label="Main" className="nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
            Tuner
          </NavLink>
          <NavLink
            to="/peaks"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            Waveforms
          </NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<TunerPage />} />
          <Route path="/peaks" element={<PeaksPage />} />
        </Routes>
      </main>
      {/* Toasts */}
      <ToastContainer />
    </div>
  )
}
