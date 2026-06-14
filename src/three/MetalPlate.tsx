import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * A brushed bright-silver faceplate rendered in WebGL and used as the chassis
 * background behind the CSS display + controls. Real PMREM environment
 * reflections (MeshPhysicalMaterial, anisotropy + clearcoat) give the metal
 * depth that CSS gradients can't. It is STATIC: rendered once after the
 * environment is ready and again on resize, so there is no idle animation and
 * no ongoing GPU cost. If WebGL is unavailable the parent's CSS silver shows
 * through as a graceful fallback.
 */
export default function MetalPlate() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return // leave CSS fallback in place
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.5
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = envRT.texture

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.set(0, 0, 3)

    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(-3, 5, 5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xbfe6ff, 0.8)
    fill.position.set(4, -2, 4)
    scene.add(fill)
    scene.add(new THREE.AmbientLight(0xffffff, 0.35))

    // horizontal brushed roughness
    const tc = document.createElement('canvas')
    tc.width = tc.height = 1024
    const tx = tc.getContext('2d')!
    tx.fillStyle = '#777'
    tx.fillRect(0, 0, 1024, 1024)
    for (let i = 0; i < 9000; i++) {
      const y = Math.random() * 1024
      const v = 95 + Math.random() * 90
      tx.strokeStyle = `rgba(${v},${v},${v},${0.05 + Math.random() * 0.1})`
      tx.lineWidth = Math.random() < 0.15 ? 1.6 : 0.6
      tx.beginPath()
      tx.moveTo(0, y)
      tx.lineTo(1024, y + (Math.random() - 0.5) * 2)
      tx.stroke()
    }
    const roughMap = new THREE.CanvasTexture(tc)
    roughMap.wrapS = roughMap.wrapT = THREE.RepeatWrapping
    roughMap.repeat.set(3, 1)

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xd0d4d6,
      metalness: 1,
      roughness: 0.26,
      roughnessMap: roughMap,
      anisotropy: 1,
      clearcoat: 0.5,
      clearcoatRoughness: 0.25,
      envMapIntensity: 1.7,
    })
    // tilt so the env reflection reads as a bright vertical gradient, not a flat fill
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 1, 1), mat)
    plate.rotation.x = -0.12
    scene.add(plate)

    function renderOnce() {
      renderer.render(scene, camera)
    }
    function resize() {
      const w = mount!.clientWidth
      const h = mount!.clientHeight || 1
      renderer.setSize(w, h, false)
      const aspect = w / h
      camera.left = -aspect
      camera.right = aspect
      camera.updateProjectionMatrix()
      plate.scale.set(aspect + 0.05, 1.05, 1)
      roughMap.repeat.set(3 * aspect, 1)
      renderOnce()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)
    // env is ready synchronously, but render again next frame for safety
    const raf = requestAnimationFrame(renderOnce)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      envRT.dispose()
      pmrem.dispose()
      roughMap.dispose()
      plate.geometry.dispose()
      mat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, zIndex: 0, borderRadius: 'inherit', overflow: 'hidden' }}
    />
  )
}
