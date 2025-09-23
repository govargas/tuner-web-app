// src/App.tsx
import { Link, Route, Routes } from "react-router";
import TunerPage from "./pages/TunerPage";
import PeaksPage from "./pages/PeaksPage";

export default function App() {
  return (
    <main className="min-h-dvh bg-neutral-900 text-cyan-300 antialiased">
      <header className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl tracking-widest font-semibold">TUNER</h1>
        <nav aria-label="Main">
          <ul className="flex gap-4">
            <li>
              <Link
                className="hover:underline focus:outline-none focus:ring"
                to="/"
              >
                Tuner
              </Link>
            </li>
            <li>
              <Link
                className="hover:underline focus:outline-none focus:ring"
                to="/peaks"
              >
                Waveforms
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <Routes>
          <Route path="/" element={<TunerPage />} />
          <Route path="/peaks" element={<PeaksPage />} />
        </Routes>
      </section>
    </main>
  );
}
