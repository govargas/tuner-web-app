export interface DisplayState {
  running: boolean
  note?: string
  hz: number
  cents?: number
  confidence: number
  rms: number
  a4: number
}

// Neon light-blue VFD palette (matches the backlit blue scale of the reference unit).
const NEON = '#46c2ff'
const NEON_HOT = '#dcf2ff'
const NEON_DIM = 'rgba(70, 194, 255, 0.22)'
const NEON_MID = 'rgba(120, 210, 255, 0.55)'

const FREQ_TICKS: [number, string][] = [
  [20, '20'],
  [50, '50'],
  [100, '100'],
  [300, '300'],
  [1000, '1k'],
  [3000, '3k'],
  [10000, '10k'],
  [20000, '20k'],
]
const BANDS = ['SUB-BASS', 'BASS', 'LOW MID', 'UPPER MID', 'PRES.', 'HIGH']

function glow(ctx: CanvasRenderingContext2D, color: string, blur: number) {
  ctx.shadowColor = color
  ctx.shadowBlur = blur
}
function noGlow(ctx: CanvasRenderingContext2D) {
  ctx.shadowBlur = 0
}

/** Draws the full neon readout onto a 2D context sized W x H. */
export function drawDisplay(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: DisplayState,
  fontsReady: boolean,
) {
  const hasSignal = s.cents != null && s.note != null
  const cents = s.cents ?? 0

  // glass
  ctx.fillStyle = '#02080f'
  ctx.fillRect(0, 0, W, H)

  // faint scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2)

  const pad = W * 0.045

  // ---- top frequency ruler -------------------------------------------------
  const rulerY = H * 0.16
  ctx.strokeStyle = NEON_MID
  ctx.lineWidth = 2
  glow(ctx, NEON, 6)
  ctx.beginPath()
  ctx.moveTo(pad, rulerY)
  ctx.lineTo(W - pad, rulerY)
  ctx.stroke()
  noGlow(ctx)

  const fx = (hz: number) => {
    const t = (Math.log10(hz) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20))
    return pad + t * (W - pad * 2)
  }
  ctx.textAlign = 'center'
  ctx.font = '600 20px "Arial Narrow", Arial, sans-serif'
  for (const [hz, label] of FREQ_TICKS) {
    const x = fx(hz)
    ctx.strokeStyle = NEON_MID
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, rulerY - 8)
    ctx.lineTo(x, rulerY + 8)
    ctx.stroke()
    ctx.fillStyle = NEON
    ctx.fillText(label, x, rulerY - 14)
  }
  ctx.font = '600 15px "Arial Narrow", Arial, sans-serif'
  ctx.fillStyle = NEON_DIM
  for (let i = 0; i < BANDS.length; i++) {
    const x = pad + ((i + 0.5) / BANDS.length) * (W - pad * 2)
    ctx.fillText(BANDS[i], x, rulerY + 26)
  }

  // ---- status row ----------------------------------------------------------
  ctx.font = '700 22px "Arial Narrow", Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = NEON
  glow(ctx, NEON, 8)
  ctx.fillText('TUNER', pad, H * 0.42)
  ctx.textAlign = 'right'
  ctx.fillStyle = hasSignal && Math.abs(cents) <= 5 ? NEON_HOT : NEON
  ctx.fillText(
    s.running ? (hasSignal && Math.abs(cents) <= 5 ? 'IN TUNE' : 'LISTENING') : 'STANDBY',
    W - pad,
    H * 0.42,
  )
  noGlow(ctx)

  // ---- big note + frequency readout ---------------------------------------
  const midY = H * 0.62
  if (fontsReady) {
    // note (14-segment)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const noteX = W * 0.3
    ctx.font = '700 150px VFD14'
    ctx.fillStyle = NEON_DIM
    ctx.fillText('~~~', noteX, midY)
    if (hasSignal) {
      glow(ctx, NEON, 14)
      ctx.fillStyle = NEON_HOT
      ctx.fillText(s.note!, noteX, midY)
      noGlow(ctx)
    }

    // frequency (7-segment)
    const freqX = W * 0.66
    ctx.font = '700 90px VFD7'
    ctx.fillStyle = NEON_DIM
    ctx.fillText('888.8', freqX, midY)
    if (s.hz) {
      glow(ctx, NEON, 20)
      ctx.fillStyle = NEON_HOT
      ctx.fillText(s.hz.toFixed(1), freqX, midY)
      noGlow(ctx)
    }
    ctx.font = '600 26px "Arial Narrow", Arial, sans-serif'
    ctx.fillStyle = NEON
    ctx.textAlign = 'left'
    ctx.fillText('Hz', freqX + W * 0.12, midY + 26)
    ctx.textBaseline = 'alphabetic'
  }

  // ---- cents strobe --------------------------------------------------------
  const strobeY = H * 0.84
  const strobeX0 = pad
  const strobeW = W - pad * 2
  const segs = 41
  const segGap = 4
  const segW = (strobeW - segGap * (segs - 1)) / segs
  const center = (segs - 1) / 2
  const pointer = Math.round(((cents + 50) / 100) * (segs - 1))
  for (let i = 0; i < segs; i++) {
    const x = strobeX0 + i * (segW + segGap)
    const isCenter = i === center
    const on = hasSignal && i === pointer
    if (on) {
      const near = Math.abs(i - center) <= 2
      ctx.fillStyle = near ? NEON_HOT : NEON
      glow(ctx, NEON, 16)
    } else if (isCenter) {
      ctx.fillStyle = NEON_MID
      noGlow(ctx)
    } else {
      ctx.fillStyle = NEON_DIM
      noGlow(ctx)
    }
    ctx.fillRect(x, strobeY - 11, isCenter ? 3 : segW, 22)
  }
  noGlow(ctx)

  // scale labels
  ctx.font = '600 16px "Arial Narrow", Arial, sans-serif'
  ctx.fillStyle = NEON
  ctx.textAlign = 'left'
  ctx.fillText('-50', strobeX0, strobeY - 20)
  ctx.textAlign = 'center'
  ctx.fillText('0', W / 2, strobeY - 20)
  ctx.fillText(`A4 ${s.a4}Hz`, W / 2, strobeY + 28)
  ctx.textAlign = 'right'
  ctx.fillText('+50', strobeX0 + strobeW, strobeY - 20)

  // confidence
  ctx.textAlign = 'right'
  ctx.fillStyle = hasSignal ? NEON : NEON_DIM
  ctx.fillText(hasSignal ? `CONF ${Math.round(s.confidence * 100)}%` : 'CONF --', W - pad, strobeY + 28)

  // ---- input level (RMS) ---------------------------------------------------
  const rmsN = Math.min(1, s.rms * 5)
  const rmsSegs = 16
  const rmsX = pad
  const rmsY = H * 0.42
  const rmsSegW = 6
  ctx.textAlign = 'left'
  for (let i = 0; i < rmsSegs; i++) {
    ctx.fillStyle = i / rmsSegs < rmsN ? NEON : NEON_DIM
    if (i / rmsSegs < rmsN) glow(ctx, NEON, 6)
    else noGlow(ctx)
    ctx.fillRect(rmsX + 70 + i * (rmsSegW + 3), rmsY - 10, rmsSegW, 12)
  }
  noGlow(ctx)
}
