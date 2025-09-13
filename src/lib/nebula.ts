import * as THREE from 'three'

export type NebulaHandle = {
  dispose: () => void
  setMouseNDC: (x: number, y: number) => void
  setBoost: (b: number) => void              // «энергия» от скорости скролла (0..1) — пульс/оживление
  setOrbitProgress: (t: number) => void      // 0..1 — прогресс прокрутки, управляет углом орбиты камеры
}

export function initNebula(canvas: HTMLCanvasElement): NebulaHandle {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
  renderer.setPixelRatio(dpr)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x0a0b0f, 1)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000)

  // ---------- базовая камера (позиция задаём в animate() из орбиты) ----------
  const ORBIT_RADIUS = 60
  let orbitT = 0            // текущий угол (радианы)
  let orbitTargetT = 0      // целевой угол (радианы)
  const ORBIT_SPAN = Math.PI * 0.9  // сколько «угла» проходим от top до bottom (~162°)

  // ---------- поле звёзд ----------
  const COUNT = 22000
  const positions = new Float32Array(COUNT * 3)
  const colors = new Float32Array(COUNT * 3)
  const color = new THREE.Color()
  for (let i = 0; i < COUNT; i++) {
    const r = 48 + 16 * Math.random()
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos((Math.random() * 2) - 1)
    positions[i*3]     = r * Math.sin(ph) * Math.cos(th)
    positions[i*3 + 1] = r * Math.sin(ph) * Math.sin(th)
    positions[i*3 + 2] = r * Math.cos(ph)
    color.setHSL(0.60 + Math.random()*0.10, 0.60, 0.60)
    colors[i*3] = color.r; colors[i*3+1] = color.g; colors[i*3+2] = color.b
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.075,
    transparent: true,
    opacity: 0.95,
    vertexColors: true,
    depthWrite: false,
    sizeAttenuation: true
  })

  // --- лёгкая локальная «подсветка» возле курсора без притяжения ---
  let shaderRef: any = null
  let patchOK = false
  ;(mat as any).onBeforeCompile = (shader: any) => {
    try {
      shader.uniforms.uMouse   = { value: new THREE.Vector2(0, 0) } // NDC курсора
      shader.uniforms.uRadius  = { value: 0.55 }                    // экранный радиус влияния
      shader.uniforms.uFarA    = { value: 40.0 }                    // откуда считаем «дальний»
      shader.uniforms.uFarB    = { value: 120.0 }                   // до куда
      shaderRef = shader

      if (!shader.vertexShader.includes('#include <project_vertex>')) {
        console.warn('[nebula] <project_vertex> not found — run without patch')
        return
      }

      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `
        uniform vec2  uMouse;
        uniform float uRadius;
        uniform float uFarA;
        uniform float uFarB;
        varying float vFall;
        void main() {
        `
      )

      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
        vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
        vec4 clip0 = projectionMatrix * mvPosition;
        vec2 ndc0 = clip0.xy / max(1e-6, clip0.w);

        // экранная дистанция до курсора
        vec2 delta = uMouse - ndc0;
        float d = length(delta);

        // плавная «линза» (только для подсветки)
        vFall = smoothstep(uRadius, 0.0, d);

        // ничего не тянем/не толкаем — только подсветим в фрагменте
        gl_Position = projectionMatrix * mvPosition;
      `)

      shader.fragmentShader = `varying float vFall;` + shader.fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace(
        'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
        'gl_FragColor = vec4( outgoingLight * (1.0 + vFall * 0.22), diffuseColor.a );'
      )

      patchOK = true
    } catch (err) {
      console.warn('[nebula] shader patch failed, fallback to plain points', err)
      patchOK = false
      shaderRef = null
    }
  }

  const points = new THREE.Points(geo, mat)
  points.rotation.x = 0.2
  scene.add(points)

  // ---------- «микро-галактика» у курсора ----------
  const sparkGroup = new THREE.Group()
  const SPARK_COUNT = 600
  const sPositions = new Float32Array(SPARK_COUNT * 3)
  const sColor = new THREE.Color(0x9bb7ff)
  for (let i = 0; i < SPARK_COUNT; i++) {
    // маленькое сферическое облачко
    const r = 3.2 * Math.cbrt(Math.random())  // плотнее к центру
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos((Math.random() * 2) - 1)
    sPositions[i*3]     = r * Math.sin(ph) * Math.cos(th)
    sPositions[i*3 + 1] = r * Math.sin(ph) * Math.sin(th)
    sPositions[i*3 + 2] = r * Math.cos(ph)
  }
  const sGeo = new THREE.BufferGeometry()
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPositions, 3))
  const sMat = new THREE.PointsMaterial({
    size: 0.9,
    color: sColor,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  })
  const sPoints = new THREE.Points(sGeo, sMat)
  sparkGroup.add(sPoints)
  scene.add(sparkGroup)

  // курсор → в мировые координаты (пересечение с плоскостью z=0)
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0) // z=0
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2(0, 0)
  const tmp = new THREE.Vector3()
  const target3D = new THREE.Vector3(0, 0, 0)
  const current3D = new THREE.Vector3(0, 0, 0)

  function setMouseNDCInternal(x: number, y: number) {
    ndc.set(x, y)
    ray.setFromCamera(ndc, camera)
    const hit = ray.ray.intersectPlane(planeZ, tmp)
    if (hit) target3D.copy(hit)
  }

  // лёгкая дымка глубины
  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshBasicMaterial({ color: 0x0a0b0f, transparent: true, opacity: 0.18 })
  )
  haze.position.z = -120
  scene.add(haze)

  // ресайз
  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', onResize)

  // состояния
  let _boost = 0

  let rafId = 0
  let t = 0
  function animate() {
    // камера на орбите вокруг центра
    orbitT += (orbitTargetT - orbitT) * 0.085
    const cx = Math.sin(orbitT) * ORBIT_RADIUS
    const cz = Math.cos(orbitT) * ORBIT_RADIUS
    const cy = Math.sin(orbitT * 0.35) * 2.2  // лёгкая высотная волна
    camera.position.set(cx, cy, cz)
    camera.lookAt(0, 0, 0)

    // курсорная «галактика»: позиция → плавно к целевой, вращение + пульс от boost
    current3D.lerp(target3D, 0.12)
    sparkGroup.position.copy(current3D)
    t += 0.016
    const scale = 0.75 + Math.sin(t * (1.0 + _boost * 1.5)) * 0.08 + _boost * 0.35
    sparkGroup.scale.setScalar(scale)
    sparkGroup.rotation.y += 0.006 + _boost * 0.010
    sparkGroup.rotation.x += 0.003

    // лёгкое фоновое вращение облака звёзд
    points.rotation.y += 0.00028
    points.rotation.x += 0.00016

    renderer.render(scene, camera)
    rafId = requestAnimationFrame(animate)
  }
  animate()

  return {
    setMouseNDC(x: number, y: number) {
      if (patchOK && shaderRef) shaderRef.uniforms.uMouse.value.set(x, y)
      setMouseNDCInternal(x, y)
    },
    setBoost(b: number) {
      _boost = Math.max(0, Math.min(1, b))
    },
    setOrbitProgress(p: number) {
      // p: 0..1 → угол в пределах ORBIT_SPAN
      p = Math.max(0, Math.min(1, p))
      orbitTargetT = -ORBIT_SPAN * 0.5 + p * ORBIT_SPAN
    },
    dispose() {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      sGeo.dispose()
      ;(sMat as any).dispose?.()
    }
  }
}
