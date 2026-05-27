<template>
  <div ref="hostRef" class="energy-orb" :class="{ 'energy-orb--fallback': fallback }">
    <canvas ref="canvasRef" aria-hidden="true"></canvas>
    <div v-if="fallback" class="energy-orb__fallback"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'

const props = withDefaults(defineProps<{
  active?: boolean
  quality?: 'low' | 'medium' | 'high'
}>(), {
  active: true,
  quality: 'medium'
})

const hostRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fallback = ref(false)

let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let root: THREE.Group | null = null
let frame = 0
let started = false
let visible = false
let reducedMotion = false

const particleCount = computed(() => {
  switch (props.quality) {
    case 'low':
      return 80
    case 'high':
      return 180
    default:
      return 120
  }
})

function canRenderWebgl() {
  const canvas = document.createElement('canvas')
  return !!(
    canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl') ||
    canvas.getContext('webgl2')
  )
}

function createScene() {
  if (!canvasRef.value || !hostRef.value || renderer) return
  if (!canRenderWebgl()) {
    fallback.value = true
    return
  }

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    alpha: true,
    antialias: props.quality !== 'low',
    powerPreference: 'high-performance'
  })
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  camera.position.set(0, 0.3, 7.2)

  const ambient = new THREE.AmbientLight(0xc777ff, 1.4)
  const point = new THREE.PointLight(0x28d8ff, 24, 20, 1.8)
  point.position.set(0, 0.4, 3.4)
  const back = new THREE.PointLight(0xff3df2, 18, 18, 1.5)
  back.position.set(-2.6, -1.4, -2)
  scene.add(ambient, point, back)

  root = new THREE.Group()
  scene.add(root)

  const coreGeometry = new THREE.SphereGeometry(1.15, 48, 48)
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb66fff,
    emissive: 0x5f30ff,
    emissiveIntensity: 1.8,
    roughness: 0.22,
    transmission: 0.16,
    transparent: true,
    opacity: 0.94
  })
  const core = new THREE.Mesh(coreGeometry, coreMaterial)
  root.add(core)

  const shellGeometry = new THREE.SphereGeometry(1.72, 32, 32)
  const shellMaterial = new THREE.MeshBasicMaterial({
    color: 0x28d8ff,
    transparent: true,
    opacity: 0.09,
    wireframe: true
  })
  const shell = new THREE.Mesh(shellGeometry, shellMaterial)
  root.add(shell)

  const ringSpecs = [
    { radius: 2.2, tube: 0.025, color: 0xff3df2, rotation: [0.8, 0.1, 0.3] },
    { radius: 2.6, tube: 0.02, color: 0x28d8ff, rotation: [1.45, 0.4, 0.9] },
    { radius: 1.8, tube: 0.018, color: 0x9e5bff, rotation: [0.2, 0.9, 1.2] }
  ] as const

  ringSpecs.forEach((ring) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(ring.radius, ring.tube, 16, 140),
      new THREE.MeshBasicMaterial({
        color: ring.color,
        transparent: true,
        opacity: 0.68
      })
    )
    mesh.rotation.set(ring.rotation[0], ring.rotation[1], ring.rotation[2])
    root?.add(mesh)
  })

  const pointsGeometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount.value * 3)
  for (let i = 0; i < particleCount.value; i += 1) {
    const stride = i * 3
    const radius = 2.4 + Math.random() * 1.8
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[stride] = radius * Math.sin(phi) * Math.cos(theta)
    positions[stride + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.65
    positions[stride + 2] = radius * Math.cos(phi)
  }
  pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const pointsMaterial = new THREE.PointsMaterial({
    color: 0xd39bff,
    size: props.quality === 'low' ? 0.045 : 0.06,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  root.add(new THREE.Points(pointsGeometry, pointsMaterial))

  updateSize()
  started = true
}

function updateSize() {
  if (!renderer || !camera || !hostRef.value) return
  const width = hostRef.value.clientWidth || 1
  const height = hostRef.value.clientHeight || 1
  const dprCap = props.quality === 'high' ? 2 : props.quality === 'medium' ? 1.6 : 1.2
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap))
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderFrame(0)
}

function renderFrame(time: number) {
  if (!renderer || !scene || !camera || !root) return
  const spin = time * 0.00028
  root.rotation.y = spin
  root.rotation.x = Math.sin(time * 0.00034) * 0.16
  const meshes = root.children
  if (meshes[0]) meshes[0].scale.setScalar(0.96 + Math.sin(time * 0.0014) * 0.04)
  if (meshes[1]) meshes[1].rotation.y = spin * 1.4
  if (meshes[2]) meshes[2].rotation.x += 0.003
  if (meshes[3]) meshes[3].rotation.y -= 0.0024
  if (meshes[4]) meshes[4].rotation.z += 0.0018
  renderer.render(scene, camera)
}

function animate(time: number) {
  if (!visible || reducedMotion) return
  renderFrame(time)
  frame = window.requestAnimationFrame(animate)
}

function startAnimation() {
  if (!props.active) return
  createScene()
  if (!renderer) return
  if (reducedMotion) {
    renderFrame(600)
    return
  }
  cancelAnimationFrame(frame)
  frame = window.requestAnimationFrame(animate)
}

function stopAnimation() {
  cancelAnimationFrame(frame)
  frame = 0
}

function destroyScene() {
  stopAnimation()
  resizeObserver?.disconnect()
  resizeObserver = null
  if (scene) {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh
      const geometry = mesh.geometry as THREE.BufferGeometry | undefined
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined
      geometry?.dispose?.()
      if (Array.isArray(material)) material.forEach((item) => item.dispose())
      else material?.dispose?.()
    })
  }
  renderer?.dispose()
  renderer = null
  scene = null
  camera = null
  root = null
  started = false
}

function bindResize() {
  if (!hostRef.value || resizeObserver) return
  resizeObserver = new ResizeObserver(() => updateSize())
  resizeObserver.observe(hostRef.value)
}

function setupIntersection() {
  if (!hostRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      visible = !!entry?.isIntersecting
      if (visible) {
        createScene()
        bindResize()
        startAnimation()
      } else {
        stopAnimation()
      }
    },
    { threshold: 0.18 }
  )
  observer.observe(hostRef.value)
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!props.active) return
  setupIntersection()
})

watch(() => props.active, (value) => {
  if (!value) {
    visible = false
    stopAnimation()
    return
  }
  if (!observer) setupIntersection()
  if (visible) startAnimation()
})

watch(() => props.quality, () => {
  if (!started) return
  destroyScene()
  if (visible && props.active) {
    createScene()
    bindResize()
    startAnimation()
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  destroyScene()
})
</script>
