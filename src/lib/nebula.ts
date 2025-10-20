import * as THREE from 'three'

export type NebulaHandle = {
  dispose: () => void
  setMouseEnabled: (v: boolean) => void
  setMouseNDC: (x: number, y: number) => void
  setBoost: (b: number) => void
  setOrbitProgress: (t: number) => void
}

/**
 * Фон:
 * • бескрайняя розово-фиолетовая дымка (без стыков, экранный шейдер): 2 рукава + облачные «пятна»,
 *   шумная ширина, вращение и течение.
 * • мягкие звёзды (дрейф/мерцание), комета, сверхмягкий параллакс.
 */
export function initNebula(canvas: HTMLCanvasElement): NebulaHandle {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
  renderer.setPixelRatio(dpr)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x07080b, 1)
  ;(renderer as any).outputColorSpace = (THREE as any).SRGBColorSpace ?? (THREE as any).sRGBEncoding
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.sortObjects = true

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000)

  const root = new THREE.Group()
  scene.add(root)

  // ---------- Camera orbit ----------
  const ORBIT_RADIUS = 60
  let orbitT = 0
  let orbitTargetT = 0
  const ORBIT_SPAN = Math.PI * 0.9

  // ---------- Fullscreen nebula (no seams; uses gl_FragCoord) ----------
  function createNebulaFullscreen() {
    const uniforms = {
      uTime:       { value: 0.0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uIntensity:  { value: 0.95 },         // яркость дымки
      uNoiseScale: { value: 1.6 },          // зернистость облаков
      uTilt:       { value: -0.28 },        // общий наклон
      uSpinSpeed:  { value: 0.03 },         // скорость вращения
      uDrift:      { value: new THREE.Vector2(0.02, -0.012) }, // течение шума
      uColorA:     { value: new THREE.Color(0xffb6ff) },
      uColorB:     { value: new THREE.Color(0x7a4bd8) },
    }

    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        // Один полноэкранный треугольник (координаты уже в clip-space)
        attribute vec3 position;
        void main() {
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform vec2  uResolution;
        uniform float uTime, uIntensity, uNoiseScale, uTilt, uSpinSpeed;
        uniform vec2  uDrift;
        uniform vec3  uColorA, uColorB;

        // --- util / noise ---
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float n2(vec2 p){
          vec2 i = floor(p), f = fract(p);
          vec2 u = f*f*(3.0-2.0*f);
          float a = hash(i + vec2(0.0,0.0));
          float b = hash(i + vec2(1.0,0.0));
          float c = hash(i + vec2(0.0,1.0));
          float d = hash(i + vec2(1.0,1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y)*2.0 - 1.0;
        }
        float fbm(vec2 p){
          float a = 0.0, w = 0.5;
          for(int i=0;i<5;i++){
            a += n2(p) * w;
            p = p*2.03 + 17.1;
            w *= 0.55;
          }
          return a;
        }
        mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

        // изогнутый «рукав» галактики с шумной шириной
        float lane(vec2 p, float baseW, float curveK, float phase){
          float curve = sin(p.x * curveK + phase) * 0.12;
          float dist  = abs(p.y + curve);
          // ширина варьируется вдоль x (fbm даёт «вздутия» и «сужения»)
          float w = baseW * (0.65 + 0.55 * clamp(fbm(vec2(p.x*0.6 + phase*0.7, 3.1+phase)) * 0.5 + 0.5, 0.0, 1.0));
          float core = smoothstep(w*1.7, w*1.0, dist) * smoothstep(w*0.9, w*0.22, dist);
          return core;
        }

        void main(){
          // Экранные NDC: [-1..1] c учётом аспекта, БЕЗ UV интерполяции (швов нет)
          vec2 p = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0;
          p.x *= uResolution.x / uResolution.y;

          // Общий наклон и медленное вращение всей дымки
          p = rot(uTilt) * p;
          float spin = uTime * uSpinSpeed;
          vec2 pSpin = rot(spin) * p;

          // Координаты шума с течением
          vec2 np = (rot(spin*0.7) * p) * uNoiseScale + uDrift * uTime;

          // ДВА РУКАВА разной ширины/кривизны и фазы
          float laneA = lane(pSpin, 0.23, 3.2, uTime*0.18);
          float laneB = lane(pSpin + vec2(0.05, 0.0), 0.34, 2.35, -uTime*0.12 + 2.1);

          // ОБЛАЧНЫЕ ПЯТНА (большие газовые скопления)
          float blobs = 0.0;
          // три «ядра», которые двигаются/пульсируют
          vec2 c0 = vec2(-0.75,  0.15 + 0.10*sin(uTime*0.21));
          vec2 c1 = vec2( 0.10, -0.10 + 0.12*sin(uTime*0.17 + 1.7));
          vec2 c2 = vec2( 0.80,  0.05 + 0.08*sin(uTime*0.19 + 3.4));
          float d0 = length(pSpin - c0);
          float d1 = length(pSpin - c1);
          float d2 = length(pSpin - c2);
          blobs += smoothstep(0.85, 0.10, d0);
          blobs += smoothstep(1.00, 0.18, d1)*0.8;
          blobs += smoothstep(1.10, 0.22, d2)*0.7;

          // Мелкомасштабная облачность (fbm)
          float clouds = fbm(np + uTime*0.02)*0.6 + fbm(np*1.7 - uTime*0.018 + 7.3)*0.4;
          clouds = pow(max(0.0, clouds), 1.05);

          // Сборка плотности: рукава + blobs, модулированные облаками
          float density = (laneA*0.85 + laneB*0.75);
          density = max(density, blobs*0.55);
          density *= (0.55 + 0.45*clouds);

          // Экранная виньетка (мягкая, эллиптическая)
          float vign = smoothstep(1.45, 0.15, length(p*vec2(0.58, 1.0)));

          // Лёгкий дезеринг альфы (без полос)
          float dither = (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.04;

          float a = clamp(density * vign + dither, 0.0, 1.0) * uIntensity;

          // Цвет: вдоль «главного» рукава даём градиент и чуть тонируем облаками
          float grad = clamp(0.5 + 0.5*sin(pSpin.x*1.15 + uTime*0.03), 0.0, 1.0);
          vec3 col = mix(uColorB, uColorA, grad) * (0.8 + 0.2*clouds);
          col = col / (1.0 + col); // лёгкий тонемап

          gl_FragColor = vec4(col, a);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
    })

    // Один полноэкранный треугольник (NDC)
    const geom = new THREE.BufferGeometry()
    const positions = new Float32Array([
      -1, -1, 0,
       3, -1, 0,
      -1,  3, 0,
    ])
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mesh = new THREE.Mesh(geom, mat)
    mesh.frustumCulled = false
    mesh.renderOrder = -200 // рисуем ДО звёзд — бесконечный фон
    return { mesh, uniforms }
  }

  const fsNebula = createNebulaFullscreen()
  root.add(fsNebula.mesh)

  // ---------- Stars ----------
  const COUNT = 18000
  const positions = new Float32Array(COUNT * 3)
  const colors = new Float32Array(COUNT * 3)
  const sizes = new Float32Array(COUNT)
  const phases = new Float32Array(COUNT)
  const seeds = new Float32Array(COUNT)
  const tmpColor = new THREE.Color()

  for (let i = 0; i < COUNT; i++) {
    const r = 52 + 28 * Math.random()
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(Math.random() * 2 - 1)
    positions[i * 3 + 0] = r * Math.sin(ph) * Math.cos(th)
    positions[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
    positions[i * 3 + 2] = r * Math.cos(ph)

    const warm = Math.random() < 0.35
    const h = warm ? 0.08 + Math.random() * 0.05 : 0.58 + Math.random() * 0.10
    const s = warm ? 0.65 : 0.55
    const l = warm ? 0.62 : 0.64
    tmpColor.setHSL(h, s, l)
    colors[i * 3 + 0] = tmpColor.r
    colors[i * 3 + 1] = tmpColor.g
    colors[i * 3 + 2] = tmpColor.b

    sizes[i] = Math.pow(Math.random(), 0.65) * 1.6 + 0.6
    phases[i] = Math.random() * Math.PI * 2
    seeds[i] = Math.random()
  }

  const starsGeo = new THREE.BufferGeometry()
  starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  starsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  starsGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  starsGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  starsGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

  const starUniforms = {
    uTime: { value: 0.0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uRadius: { value: 0.38 },
    uSizeBase: { value: 7.5 },
    uPixelRatio: { value: dpr },
    uDriftAmp: { value: 0.35 },
    uDriftFreq: { value: 0.15 },
    uCurlAmp: { value: 0.20 },
    uTwinkleAmp: { value: 0.40 },
    uTwinkleCol: { value: 0.14 },
  }

  const starsMat = new THREE.ShaderMaterial({
    uniforms: starUniforms,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uSizeBase, uPixelRatio, uRadius;
      uniform float uDriftAmp, uDriftFreq, uCurlAmp, uTwinkleAmp;
      uniform vec2  uMouse;
      attribute float aSize, aPhase, aSeed;
      varying vec3  vColor;
      varying float vFall;
      varying float vTw;
      float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7, 74.7))) * 43758.5453); }
      float n3(vec3 p){
        vec3 i = floor(p), f = fract(p);
        vec3 u = f*f*(3.0-2.0*f);
        float n =
          mix(mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), u.x),
                  mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), u.x), u.y),
              mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), u.x),
                  mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), u.x), u.y), u.z);
        return n*2.0-1.0;
      }
      void main() {
        vColor = color;
        vec3 p = position;

        float w = uDriftFreq * (0.5 + aSeed * 1.5);
        float t  = uTime * w + aPhase * 2.7;

        vec3 swirl = vec3(
          sin(t + p.y*0.03),
          cos(t*0.9 + p.x*0.025),
          sin(t*0.75 + p.z*0.02)
        ) * uDriftAmp * (0.25 + aSeed);

        vec3 q = p * 0.03 + vec3(aSeed*5.0, aPhase, 0.0) + vec3(uTime*0.05, 0.0, -uTime*0.04);
        vec3 curl = vec3(
          n3(q + vec3(0.0, 0.0, 1.7)) - n3(q + vec3(0.0, 0.0,-1.7)),
          n3(q + vec3(1.7, 0.0, 0.0)) - n3(q + vec3(-1.7,0.0, 0.0)),
          n3(q + vec3(0.0, 1.7, 0.0)) - n3(q + vec3(0.0,-1.7, 0.0))
        ) * 0.5 * uCurlAmp;

        p += swirl + curl;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vec4 clip = projectionMatrix * mv;

        vec2 ndc = clip.xy / max(1e-6, clip.w);
        float dist = length(uMouse - ndc);
        vFall = smoothstep(uRadius, 0.0, dist) * smoothstep(0.0, uRadius * 1.2, dist);

        vTw = 0.85 + uTwinkleAmp * sin(uTime * (0.8 + fract(aPhase)*1.6) + aPhase);

        float viewZ = -mv.z;
        float sizePx = (uSizeBase * aSize * vTw) / (1.0 + viewZ * 0.04);
        gl_PointSize = sizePx * uPixelRatio;
        gl_Position = clip;
      }
    `,
    fragmentShader: `
      varying vec3  vColor;
      varying float vFall, vTw;
      uniform float uTwinkleCol;
      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float r = length(uv);
        float core = smoothstep(0.22, 0.0, r);
        float halo = smoothstep(1.0, 0.22, r);
        float alpha = clamp(core * 1.2 + halo * 0.55, 0.0, 1.0);
        vec3 colShift = vec3(uTwinkleCol * (vTw - 1.0));
        vec3 col = (vColor + colShift) * (1.0 + vFall * 0.22) * 1.08;
        col = pow(col, vec3(0.95));
        col = col / (1.0 + col);
        gl_FragColor = vec4(col, alpha);
        if (gl_FragColor.a < 0.02) discard;
      }
    `,
  })

  const stars = new THREE.Points(starsGeo, starsMat)
  stars.rotation.x = 0.25
  stars.renderOrder = -100
  root.add(stars)

  // ---------- Cursor micro-galaxy ----------
  const sparkGroup = new THREE.Group()
  const SPARK_COUNT = 380
  const sPos = new Float32Array(SPARK_COUNT * 3)
  const sColor = new THREE.Color(0x9bb7ff)
  for (let i = 0; i < SPARK_COUNT; i++) {
    const r = 2.6 * Math.cbrt(Math.random())
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(Math.random() * 2 - 1)
    sPos[i * 3 + 0] = r * Math.sin(ph) * Math.cos(th)
    sPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
    sPos[i * 3 + 2] = r * Math.cos(ph)
  }
  const sGeo = new THREE.BufferGeometry()
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
  const sMat = new THREE.PointsMaterial({
    size: 1.0,
    color: sColor,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })
  const sPts = new THREE.Points(sGeo, sMat)
  sparkGroup.add(sPts)
  root.add(sparkGroup)

  // ---------- Depth haze ----------
  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshBasicMaterial({ color: 0x0a0b0f, transparent: true, opacity: 0.12 })
  )
  haze.position.z = -120
  root.add(haze)

  // ---------- Comet ----------
  const comet = new THREE.Group()
  root.add(comet)

  const cometHeadUniforms = { uAlpha: { value: 0.0 } }
  const cometHead = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.2),
    new THREE.ShaderMaterial({
      uniforms: cometHeadUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        uniform float uAlpha;
        varying vec2 vUv;
        void main(){
          vec2 uv = vUv*2.0 - 1.0;
          float r = length(uv);
          float core = smoothstep(0.25, 0.0, r);
          float glow = smoothstep(1.0, 0.25, r);
          vec3 col = mix(vec3(1.0,0.85,0.6), vec3(0.7,0.9,1.2), 0.35);
          float a = clamp(core*1.1 + glow*0.5, 0.0, 1.0) * uAlpha;
          gl_FragColor = vec4(col, a);
          if (gl_FragColor.a < 0.02) discard;
        }
      `,
    })
  )
  comet.add(cometHead)

  const cometTailUniforms = { uAlpha: { value: 0.0 }, uLength: { value: 7.0 }, uWidth: { value: 0.8 } }
  const cometTail = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      uniforms: cometTailUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        uniform float uLength, uWidth;
        varying vec2 vUv;
        void main(){
          vUv = uv;
          vec3 pos = position;
          pos.x *= uLength;
          pos.y *= uWidth;
          pos.x -= 0.5 * uLength;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uAlpha;
        varying vec2 vUv;
        void main(){
          float head = smoothstep(0.55, 0.5, vUv.x);
          float fade = smoothstep(0.0, 1.0, vUv.x);
          float shape = head * (1.0 - abs(vUv.y - 0.5)*2.0);
          float a = clamp(shape * 0.95 * fade, 0.0, 1.0) * uAlpha;
          vec3 col = mix(vec3(0.9,0.8,1.0), vec3(1.0,0.6,0.2), 0.35);
          gl_FragColor = vec4(col, a);
          if (gl_FragColor.a < 0.02) discard;
        }
      `,
    })
  )
  cometTail.position.x = -0.1
  comet.add(cometTail)

  let cometActive = false
  let cometVel = new THREE.Vector3()
  let cometTTL = 0
  let nextCometT = 0

  function launchComet() {
    cometActive = true
    cometTailUniforms.uAlpha.value = 0.0
    cometHeadUniforms.uAlpha.value = 0.0
    const y = THREE.MathUtils.randFloat(-6, 6)
    const z = THREE.MathUtils.randFloat(-18, 8)
    comet.position.set(+90, y, z)
    const target = new THREE.Vector3(-90, y + THREE.MathUtils.randFloat(-4, 4), z + THREE.MathUtils.randFloat(-6, 6))
    const dir = target.clone().sub(comet.position).normalize()
    const speed = THREE.MathUtils.randFloat(18, 28)
    cometVel.copy(dir).multiplyScalar(speed)
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.clone().normalize())
    comet.setRotationFromQuaternion(quat)
    cometTailUniforms.uLength.value = THREE.MathUtils.randFloat(7, 11)
    cometTailUniforms.uWidth.value = THREE.MathUtils.randFloat(0.5, 0.9)
    cometTTL = THREE.MathUtils.randFloat(6, 9)
  }

  // ---------- Resize ----------
  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    starUniforms.uPixelRatio.value = Math.min(2, window.devicePixelRatio || 1)
    // критично: для экранного шейдера обновляем uResolution
    ;(fsNebula.mesh.material as THREE.ShaderMaterial).uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onResize, { passive: true })

  // ---------- Smooth scroll parallax ----------
  let rafId = 0
  let t = 0
  let _boost = 0
  let scrollRaw = 0
  let parallax = 0
  const PARALLAX_FACTOR = 0.004
  const PARALLAX_DAMP = 0.15
  function onScroll() {
    scrollRaw = window.scrollY || 0
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  // ---------- Mouse ray ----------
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2(0, 0)
  const tmpV = new THREE.Vector3()
  const target3D = new THREE.Vector3(0, 0, 0)
  const current3D = new THREE.Vector3(0, 0, 0)
  function setMouseNDCInternal(x: number, y: number) {
    ndc.set(x, y)
    ray.setFromCamera(ndc, camera)
    const hit = ray.ray.intersectPlane(planeZ, tmpV)
    if (hit) target3D.copy(hit)
  }

  // ---------- Animate ----------
  function animate() {
    // орбита камеры
    orbitT += (orbitTargetT - orbitT) * 0.085
    const cx = Math.sin(orbitT) * ORBIT_RADIUS
    const cz = Math.cos(orbitT) * ORBIT_RADIUS
    const cy = Math.sin(orbitT * 0.35) * 2.2
    camera.position.set(cx, cy, cz)
    camera.lookAt(0, 0, 0)

    // искры
    current3D.lerp(target3D, 0.12)
    sparkGroup.position.copy(current3D)

    t += 0.016

    const scale = 0.75 + Math.sin(t * (1.0 + _boost * 1.5)) * 0.08 + _boost * 0.35
    sparkGroup.scale.setScalar(scale)
    sparkGroup.rotation.y += 0.006 + _boost * 0.010
    sparkGroup.rotation.x += 0.003

    stars.rotation.y += 0.0002
    stars.rotation.x += 0.00011

    // обновление дымки
    ;(fsNebula.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = t

    // комета
    nextCometT -= 0.016
    if (nextCometT <= 0 && !cometActive) {
      launchComet()
      nextCometT = THREE.MathUtils.randFloat(12, 20)
    }
    if (cometActive) {
      if (cometTailUniforms.uAlpha.value < 1.0 && cometTTL > 1.0) {
        const a = Math.min(1.0, cometTailUniforms.uAlpha.value + 0.06)
        cometTailUniforms.uAlpha.value = a
        cometHeadUniforms.uAlpha.value = a
      }
      comet.position.addScaledVector(cometVel, 0.016)
      cometTTL -= 0.016
      cometHead.quaternion.copy(camera.quaternion)
      if (cometTTL < 1.2) {
        cometTailUniforms.uAlpha.value = Math.max(0.0, cometTailUniforms.uAlpha.value - 0.04)
        cometHeadUniforms.uAlpha.value = cometTailUniforms.uAlpha.value
      }
      if (cometTTL <= 0) {
        cometActive = false
        cometTailUniforms.uAlpha.value = 0.0
        cometHeadUniforms.uAlpha.value = 0.0
      }
    }

    // параллакс
    const targetParallax = -scrollRaw * PARALLAX_FACTOR
    parallax += (targetParallax - parallax) * PARALLAX_DAMP
    root.position.y = parallax * 0.004
    root.position.z = parallax * 0.002

    starUniforms.uTime.value = t

    renderer.render(scene, camera)
    rafId = requestAnimationFrame(animate)
  }
  animate()

  // ---------- API ----------
  let mouseEnabled = true
  const shaderRef: any = { uniforms: starUniforms }
  const patchOK = true

  return {
    setMouseEnabled(v: boolean) {
      mouseEnabled = !!v
      if (patchOK && shaderRef) shaderRef.uniforms.uRadius.value = mouseEnabled ? 0.38 : 0.0
      sparkGroup.visible = mouseEnabled
    },
    setMouseNDC(x: number, y: number) {
      if (!mouseEnabled) return
      if (patchOK && shaderRef) shaderRef.uniforms.uMouse.value.set(x, y)
      setMouseNDCInternal(x, y)
    },
    setBoost(b: number) {
      _boost = Math.max(0, Math.min(1, b))
    },
    setOrbitProgress(p: number) {
      p = Math.max(0, Math.min(1, p))
      orbitTargetT = -ORBIT_SPAN * 0.5 + p * ORBIT_SPAN
    },
    dispose() {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      renderer.dispose()
      ;(fsNebula.mesh.geometry as THREE.BufferGeometry).dispose()
      ;(fsNebula.mesh.material as THREE.Material).dispose()
      starsGeo.dispose()
      ;(starsMat as any).dispose?.()
      sGeo.dispose()
      ;(sMat as any).dispose?.()
      ;(haze.geometry as THREE.BufferGeometry).dispose()
      ;(haze.material as THREE.Material).dispose()
      ;(cometHead.material as THREE.Material).dispose()
      ;(cometTail.material as THREE.Material).dispose()
    },
  }
}
