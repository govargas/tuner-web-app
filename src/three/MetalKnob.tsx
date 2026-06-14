import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export interface MetalKnobProps {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}

/**
 * A single brushed-metal knob rendered in its own isolated WebGL canvas.
 * This is the one place three.js earns its weight: a real environment-mapped
 * reflective surface (PMREM RoomEnvironment + MeshPhysicalMaterial) that CSS
 * gradients cannot convincingly fake. Everything else on the page is CSS.
 *
 * Vertical drag changes the value; the value is mirrored by the accessible
 * range input elsewhere on the page, so this canvas can stay aria-hidden.
 */
export default function MetalKnob({ value, min, max, onChange }: MetalKnobProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef({ value, min, max, onChange })
  valueRef.current = { value, min, max, onChange }

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.cursor = 'ns-resize'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = envRT.texture

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, 0.55, 4)
    camera.lookAt(0, 0, 0)

    const key = new THREE.DirectionalLight(0xffffff, 1.3)
    key.position.set(-4, 6, 6)
    scene.add(key)
    scene.add(new THREE.AmbientLight(0xffffff, 0.2))

    // radial brushed roughness map
    const tc = document.createElement('canvas')
    tc.width = tc.height = 512
    const tctx = tc.getContext('2d')!
    tctx.fillStyle = '#777'
    tctx.fillRect(0, 0, 512, 512)
    tctx.translate(256, 256)
    for (let i = 0; i < 4200; i++) {
      const a = Math.random() * Math.PI * 2
      const v = 90 + Math.random() * 100
      tctx.strokeStyle = `rgba(${v},${v},${v},${0.05 + Math.random() * 0.1})`
      tctx.lineWidth = 0.7
      tctx.beginPath()
      tctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30)
      tctx.lineTo(Math.cos(a) * 512, Math.sin(a) * 512)
      tctx.stroke()
    }
    const roughMap = new THREE.CanvasTexture(tc)

    const knobMat = new THREE.MeshPhysicalMaterial({
      color: 0xc4c8ca,
      metalness: 1,
      roughness: 0.26,
      roughnessMap: roughMap,
      anisotropy: 1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.25,
    })

    const knob = new THREE.Group()
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.97, 0.6, 96), knobMat)
    body.rotation.x = Math.PI / 2
    knob.add(body)
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.06, 24, 96),
      new THREE.MeshPhysicalMaterial({ color: 0x8c9092, metalness: 1, roughness: 0.18 }),
    )
    rim.position.z = 0.3
    knob.add(rim)
    const dot = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.5, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x20242a, metalness: 0.7, roughness: 0.6 }),
    )
    dot.position.set(0, 0.4, 0.32)
    knob.add(dot)
    scene.add(knob)

    function resize() {
      const w = mount!.clientWidth
      const h = mount!.clientHeight || w
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    // ---- drag --------------------------------------------------------------
    let dragging = false
    let startY = 0
    let startVal = value
    function onDown(e: PointerEvent) {
      dragging = true
      startY = e.clientY
      startVal = valueRef.current.value
      renderer.domElement.setPointerCapture(e.pointerId)
    }
    function onMove(e: PointerEvent) {
      if (!dragging) return
      const { min: mn, max: mx, onChange: cb, value: cur } = valueRef.current
      const delta = (startY - e.clientY) / (mount!.clientHeight || 150)
      const next = Math.round(startVal + delta * (mx - mn) * 1.5)
      const clamped = Math.max(mn, Math.min(mx, next))
      if (clamped !== cur) cb(clamped)
    }
    function onUp() {
      dragging = false
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    let raf = 0
    const clock = new THREE.Clock()
    function frame() {
      const { value: v, min: mn, max: mx } = valueRef.current
      const t = (v - mn) / (mx - mn)
      knob.rotation.z = (0.5 - t) * (Math.PI * 1.5)
      if (!reduceMotion) {
        const e = clock.getElapsedTime()
        key.position.x = Math.sin(e * 0.4) * 5
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(frame)
    }
    frame()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      envRT.dispose()
      pmrem.dispose()
      roughMap.dispose()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh) {
          m.geometry.dispose()
          const mat = m.material
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
          else mat.dispose()
        }
      })
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={mountRef} aria-hidden="true" style={{ width: '100%', height: '100%', minHeight: '150px' }} />
}
