import * as THREE from 'three'

/** Offscreen 2D canvas helper. */
function makeCanvas(size: number) {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  return { c, ctx: c.getContext('2d')! }
}

/**
 * Procedural brushed-metal roughness map. Streaks of varying roughness give
 * MeshPhysicalMaterial's anisotropy something to catch the light on, which is
 * what reads as "brushed aluminium".
 *  - mode 'h' : horizontal grain (faceplate)
 *  - mode 'r' : radial grain (knob tops)
 */
export function brushedRoughnessTexture(mode: 'h' | 'r', size = 1024): THREE.Texture {
  const { c, ctx } = makeCanvas(size)
  ctx.fillStyle = '#7a7a7a'
  ctx.fillRect(0, 0, size, size)

  if (mode === 'h') {
    for (let i = 0; i < size * 8; i++) {
      const y = Math.random() * size
      const v = 90 + Math.random() * 90
      ctx.strokeStyle = `rgba(${v},${v},${v},${0.06 + Math.random() * 0.12})`
      ctx.lineWidth = Math.random() < 0.15 ? 1.6 : 0.6
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(size, y + (Math.random() - 0.5) * 2)
      ctx.stroke()
    }
  } else {
    const cx = size / 2
    const cy = size / 2
    ctx.translate(cx, cy)
    for (let i = 0; i < 5200; i++) {
      const a = Math.random() * Math.PI * 2
      const v = 90 + Math.random() * 100
      ctx.strokeStyle = `rgba(${v},${v},${v},${0.05 + Math.random() * 0.1})`
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * 40, Math.sin(a) * 40)
      ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size)
      ctx.stroke()
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  return tex
}
