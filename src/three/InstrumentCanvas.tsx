import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { brushedRoughnessTexture } from './brushedTextures'
import { drawDisplay, type DisplayState } from './displayDraw'

const FW = 12 // faceplate width (world units)
const FH = 3.9 // faceplate height
const BLOOM_LAYER = 1

const A4_MIN = 432
const A4_MAX = 446

export interface InstrumentCanvasProps extends DisplayState {
  onA4Change: (a4: number) => void
}

export default function InstrumentCanvas(props: InstrumentCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  // live state the render loop reads without re-creating the scene
  const stateRef = useRef<InstrumentCanvasProps>(props)
  stateRef.current = props

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ---- renderer ----------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'

    // ---- scene + environment ----------------------------------------------
    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = envRT.texture

    const camera = new THREE.OrthographicCamera(-FW / 2, FW / 2, FH / 2, -FH / 2, 0.1, 100)
    camera.position.set(0, 0, 12)
    camera.lookAt(0, 0, 0)

    // moving key light → specular sweep across the brushed metal
    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(-6, 8, 9)
    scene.add(key)
    scene.add(new THREE.AmbientLight(0xffffff, 0.15))

    // ---- materials ---------------------------------------------------------
    const faceRough = brushedRoughnessTexture('h')
    faceRough.repeat.set(2.5, 1)
    const knobRough = brushedRoughnessTexture('r')

    const faceMat = new THREE.MeshPhysicalMaterial({
      color: 0xb7bcbe,
      metalness: 1,
      roughness: 0.34,
      roughnessMap: faceRough,
      anisotropy: 1,
      anisotropyRotation: 0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.28,
      envMapIntensity: 1.1,
    })
    const knobMat = new THREE.MeshPhysicalMaterial({
      color: 0xc2c6c8,
      metalness: 1,
      roughness: 0.28,
      roughnessMap: knobRough,
      anisotropy: 1,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.2,
    })
    const darkMetal = new THREE.MeshPhysicalMaterial({
      color: 0x0c1014,
      metalness: 0.9,
      roughness: 0.5,
      envMapIntensity: 0.8,
    })

    // ---- faceplate ---------------------------------------------------------
    const faceplate = new THREE.Mesh(new RoundedBoxGeometry(FW, FH, 0.5, 6, 0.12), faceMat)
    scene.add(faceplate)

    // ---- display -----------------------------------------------------------
    const dispW = 6.7
    const dispH = 2.8
    const dispX = -0.4
    // recessed bezel
    const bezel = new THREE.Mesh(
      new RoundedBoxGeometry(dispW + 0.22, dispH + 0.22, 0.36, 4, 0.06),
      darkMetal,
    )
    bezel.position.set(dispX, 0, 0.18)
    scene.add(bezel)

    const dispCanvas = document.createElement('canvas')
    dispCanvas.width = 1280
    dispCanvas.height = Math.round((1280 * dispH) / dispW)
    const dispCtx = dispCanvas.getContext('2d')!
    const dispTex = new THREE.CanvasTexture(dispCanvas)
    dispTex.colorSpace = THREE.SRGBColorSpace
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(dispW, dispH),
      new THREE.MeshBasicMaterial({ map: dispTex, toneMapped: false }),
    )
    screen.position.set(dispX, 0, 0.37)
    screen.layers.enable(BLOOM_LAYER)
    scene.add(screen)

    // ---- knobs -------------------------------------------------------------
    function makeKnob(x: number, radius: number) {
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.98, 0.5, 64), knobMat)
      body.rotation.x = Math.PI / 2
      g.add(body)
      // beveled rim
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.05, 16, 64),
        new THREE.MeshPhysicalMaterial({ color: 0x8a8f91, metalness: 1, roughness: 0.2 }),
      )
      rim.position.z = 0.25
      g.add(rim)
      // pointer indicator (subtle engraved dot, not emissive)
      const dot = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, radius * 0.55, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x222629, metalness: 0.8, roughness: 0.6 }),
      )
      dot.position.set(0, radius * 0.42, 0.27)
      g.add(dot)
      g.position.set(x, 0, 0.3)
      scene.add(g)
      return g
    }
    const outputKnob = makeKnob(4.6, 1.05)
    outputKnob.rotation.z = -0.7
    const a4Knob = makeKnob(-4.95, 0.92)
    const a4KnobHit = a4Knob.children[0] as THREE.Mesh

    // ---- engraved labels overlay ------------------------------------------
    const labelCanvas = document.createElement('canvas')
    labelCanvas.width = 2048
    labelCanvas.height = Math.round((2048 * FH) / FW)
    const lctx = labelCanvas.getContext('2d')!
    function engrave(text: string, x: number, y: number, size: number, align: CanvasTextAlign) {
      lctx.textAlign = align
      lctx.font = `700 ${size}px "Arial Narrow", Arial, sans-serif`
      lctx.fillStyle = 'rgba(20,22,24,0.55)'
      lctx.fillText(text, x, y + 1.5)
      lctx.fillStyle = 'rgba(232,236,238,0.5)'
      lctx.fillText(text, x, y - 1)
    }
    const LW = labelCanvas.width
    const LH = labelCanvas.height
    engrave('TUNER', LW * 0.02, LH * 0.16, 46, 'left')
    engrave('REAL-TIME PITCH REFERENCE', LW * 0.98, LH * 0.14, 24, 'right')
    engrave('OUTPUT', LW * 0.79, LH * 0.92, 30, 'center')
    engrave('A4 REF', LW * 0.085, LH * 0.92, 28, 'center')
    engrave('TURN', LW * 0.085, LH * 0.08, 18, 'center')
    const labelTex = new THREE.CanvasTexture(labelCanvas)
    labelTex.colorSpace = THREE.SRGBColorSpace
    const labels = new THREE.Mesh(
      new THREE.PlaneGeometry(FW, FH),
      new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, opacity: 0.85 }),
    )
    labels.position.z = 0.26
    scene.add(labels)

    // ---- selective bloom (only the display glows) -------------------------
    const bloomLayer = new THREE.Layers()
    bloomLayer.set(BLOOM_LAYER)
    const darkMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const stash = new Map<string, THREE.Material | THREE.Material[]>()

    const renderPass = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.55, 0.0)
    const bloomComposer = new EffectComposer(renderer)
    bloomComposer.renderToScreen = false
    bloomComposer.addPass(renderPass)
    bloomComposer.addPass(bloomPass)

    const mixPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform sampler2D baseTexture; uniform sampler2D bloomTexture; varying vec2 vUv;
          void main(){ gl_FragColor = texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv); }`,
        defines: {},
      }),
      'baseTexture',
    )
    mixPass.needsSwap = true
    const finalComposer = new EffectComposer(renderer)
    finalComposer.addPass(renderPass)
    finalComposer.addPass(mixPass)
    finalComposer.addPass(new OutputPass())

    function darken(obj: THREE.Object3D) {
      const m = obj as THREE.Mesh
      if (m.isMesh && bloomLayer.test(m.layers) === false) {
        stash.set(m.uuid, m.material)
        m.material = darkMat
      }
    }
    function restore(obj: THREE.Object3D) {
      const m = obj as THREE.Mesh
      if (stash.has(m.uuid)) {
        m.material = stash.get(m.uuid)!
        stash.delete(m.uuid)
      }
    }

    // ---- sizing ------------------------------------------------------------
    function resize() {
      const w = mount!.clientWidth
      const h = mount!.clientHeight || w / (FW / FH)
      renderer.setSize(w, h, false)
      bloomComposer.setSize(w, h)
      finalComposer.setSize(w, h)
      const aspect = w / h
      const contentAspect = FW / FH
      if (aspect > contentAspect) {
        camera.top = FH / 2
        camera.bottom = -FH / 2
        camera.left = (-FH / 2) * aspect
        camera.right = (FH / 2) * aspect
      } else {
        camera.left = -FW / 2
        camera.right = FW / 2
        camera.top = FW / 2 / aspect
        camera.bottom = -FW / 2 / aspect
      }
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    // ---- A4 knob drag ------------------------------------------------------
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    let dragging = false
    let dragStartY = 0
    let dragStartA4 = props.a4

    function pointerHitsA4(e: PointerEvent) {
      const r = renderer.domElement.getBoundingClientRect()
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1
      raycaster.setFromCamera(ndc, camera)
      raycaster.layers.enableAll()
      return raycaster.intersectObject(a4KnobHit, true).length > 0
    }
    function onDown(e: PointerEvent) {
      if (!pointerHitsA4(e)) return
      dragging = true
      dragStartY = e.clientY
      dragStartA4 = stateRef.current.a4
      renderer.domElement.setPointerCapture(e.pointerId)
      renderer.domElement.style.cursor = 'ns-resize'
    }
    function onMove(e: PointerEvent) {
      if (!dragging) return
      const r = renderer.domElement.getBoundingClientRect()
      const delta = (dragStartY - e.clientY) / r.height
      const next = Math.round(dragStartA4 + delta * (A4_MAX - A4_MIN) * 1.6)
      const clamped = Math.max(A4_MIN, Math.min(A4_MAX, next))
      if (clamped !== stateRef.current.a4) stateRef.current.onA4Change(clamped)
    }
    function onUp() {
      dragging = false
      renderer.domElement.style.cursor = ''
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    // ---- font loading ------------------------------------------------------
    let fontsReady = false
    Promise.all([
      document.fonts.load('700 100px VFD14', '~ABCG#'),
      document.fonts.load('700 100px VFD7', '8.0'),
    ])
      .then(() => {
        fontsReady = true
      })
      .catch(() => {
        fontsReady = true
      })

    // ---- render loop -------------------------------------------------------
    let raf = 0
    const clock = new THREE.Clock()
    function frame() {
      const t = clock.getElapsedTime()
      const s = stateRef.current

      // light sweep (decorative → reduced-motion disables it)
      if (!reduceMotion) {
        key.position.x = Math.sin(t * 0.25) * 7
        key.position.y = 6 + Math.cos(t * 0.2) * 2.5
      }

      // knob reflects A4 value (-135deg..+135deg)
      const a4t = (s.a4 - A4_MIN) / (A4_MAX - A4_MIN)
      a4Knob.rotation.z = (0.5 - a4t) * (Math.PI * 1.5)

      // redraw display
      drawDisplay(dispCtx, dispCanvas.width, dispCanvas.height, s, fontsReady)
      dispTex.needsUpdate = true

      // selective bloom: darken everything except the screen, bloom, restore, composite
      scene.traverse(darken)
      bloomComposer.render()
      scene.traverse(restore)
      finalComposer.render()

      raf = requestAnimationFrame(frame)
    }
    frame()

    // ---- cleanup -----------------------------------------------------------
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      bloomComposer.dispose()
      finalComposer.dispose()
      envRT.dispose()
      pmrem.dispose()
      dispTex.dispose()
      labelTex.dispose()
      faceRough.dispose()
      knobRough.dispose()
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

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{ width: '100%', aspectRatio: `${FW} / ${FH}`, borderRadius: '14px', overflow: 'hidden' }}
    />
  )
}
