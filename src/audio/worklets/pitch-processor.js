// src/audio/worklets/pitch-processor.js
// Simple YIN-like pitch detector. Posts { hz, confidence } periodically.

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._sr = sampleRate;
    this._buf = new Float32Array(2048);
    this._pos = 0;
    this._lastPost = 0;
  }

  static get parameterDescriptors() {
    return [];
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const ch = input[0];
    if (!ch) return true;

    // Fill internal buffer until full
    const remain = this._buf.length - this._pos;
    const toCopy = Math.min(remain, ch.length);
    this._buf.set(ch.subarray(0, toCopy), this._pos);
    this._pos += toCopy;

    if (this._pos >= this._buf.length) {
      const { freq, conf } = detectYIN(this._buf, this._sr);

      // Throttle posts a bit (~60fps)
      const now = currentTime;
      if (now - this._lastPost > 0.016) {
        this.port.postMessage({ hz: freq, confidence: conf });
        this._lastPost = now;
      }

      // Slide half window to reduce latency
      const half = this._buf.length >> 1;
      this._buf.copyWithin(0, half);
      this._pos = half;
    }
    return true;
  }
}

function detectYIN(buffer, sr) {
  const N = buffer.length;
  const tauMax = Math.floor(sr / 50); // ~20 Hz lower bound
  const tauMin = Math.floor(sr / 1000); // ~1 kHz upper bound

  const d = new Float32Array(tauMax);
  for (let tau = tauMin; tau < tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < N - tau; i++) {
      const diff = buffer[i] - buffer[i + tau];
      sum += diff * diff;
    }
    d[tau] = sum;
  }

  const cmnd = new Float32Array(tauMax);
  let running = 0;
  cmnd[0] = 1;
  for (let tau = 1; tau < tauMax; tau++) {
    running += d[tau];
    cmnd[tau] = (d[tau] * tau) / (running || 1);
  }

  const threshold = 0.15;
  let tau = -1;
  for (let t = tauMin; t < tauMax; t++) {
    if (cmnd[t] < threshold) {
      // Walk downhill to local minimum
      while (t + 1 < tauMax && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) return { freq: 0, conf: 0 };

  // Parabolic interpolation around local min
  const x0 = tau <= 1 ? tau : tau - 1;
  const x2 = tau + 1 < tauMax ? tau + 1 : tau;
  const s0 = cmnd[x0];
  const s1 = cmnd[tau];
  const s2 = cmnd[x2];
  const denom = s0 - 2 * s1 + s2;
  const betterTau = tau + (denom !== 0 ? (s0 - s2) / (2 * denom) : 0);

  const freq = sr / betterTau;
  const confidence = Math.max(0, Math.min(1, 1 - s1));
  if (!isFinite(freq) || freq <= 0) return { freq: 0, conf: 0 };
  return { freq, conf: confidence };
}

registerProcessor("pitch-processor", PitchProcessor);
