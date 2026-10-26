// Extracted from AGASSU's buildBaseArenaPortalWorld.ts. Game logic is not included.
import * as THREE from 'three'

function makePortalSurfaceGeometry(width: number, height: number) {
  const edgeBleed = 0.14
  const geometry = new THREE.PlaneGeometry(width + edgeBleed * 2, height + edgeBleed * 2)
  const positions = geometry.getAttribute('position')
  const uvs = geometry.getAttribute('uv')
  for (let i = 0; i < positions.count; i++) {
    uvs.setXY(
      i,
      positions.getX(i) / width + 0.5,
      positions.getY(i) / height + 0.5,
    )
  }
  uvs.needsUpdate = true
  return geometry
}

export function makePortalVisual(
  name: string,
  width: number,
  height: number,
  position: THREE.Vector3,
  rotationY: number,
  initialTopCornerCut = 0.24,
  initialBottomCornerCut = 0.18,
  initialSidePointOffset = 0.14,
) {
  const group = new THREE.Group()
  group.name = name
  group.position.copy(position)
  group.rotation.y = rotationY

  const portalMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: null as THREE.Texture | null },
      uViewportSize: { value: new THREE.Vector2(1, 1) },
      uHasTexture: { value: 0 },
      uReveal: { value: 1 },
      uCameraFade: { value: 1 },
      uTime: { value: 0 },
      uInterior: { value: 0 },
      uEnergy: { value: 1 },
      uTurbulence: { value: 1 },
      uShape: {
        value: new THREE.Vector3(initialTopCornerCut, initialBottomCornerCut, initialSidePointOffset),
      },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform vec2 uViewportSize;
      uniform float uHasTexture;
      uniform float uReveal;
      uniform float uCameraFade;
      uniform float uTime;
      uniform float uInterior, uEnergy, uTurbulence;
      uniform vec3 uShape;
      varying vec2 vUv;

      float portalFlow(vec2 p, float time) {
        float primary = sin(dot(p, vec2(17.0, 11.0)) + time * 0.72);
        float cross = sin(dot(p, vec2(-27.0, 31.0)) - time * 0.93 + primary * 0.55);
        float detail = sin(dot(p, vec2(54.0, -43.0)) + time * 1.46 + cross * 0.42);
        return primary * 0.52 + cross * 0.31 + detail * 0.17;
      }

      float segmentDistance(vec2 p, vec2 a, vec2 b) {
        vec2 segment = b - a;
        float t = clamp(dot(p - a, segment) / dot(segment, segment), 0.0, 1.0);
        return length(p - (a + segment * t));
      }

      void main() {
        if (uCameraFade <= 0.01) discard;
        float topCut = uShape.x * 0.5;
        float bottomCut = uShape.y * 0.5;
        float sideY = 0.5 + uShape.z * 0.5;
        vec2 a = vec2(topCut, 1.0);
        vec2 b = vec2(1.0 - topCut, 1.0);
        vec2 c = vec2(1.0, sideY);
        vec2 d = vec2(1.0 - bottomCut, 0.0);
        vec2 e = vec2(bottomCut, 0.0);
        vec2 f = vec2(0.0, sideY);
        float edgeDistance = segmentDistance(vUv, a, b);
        edgeDistance = min(edgeDistance, segmentDistance(vUv, b, c));
        edgeDistance = min(edgeDistance, segmentDistance(vUv, c, d));
        edgeDistance = min(edgeDistance, segmentDistance(vUv, d, e));
        edgeDistance = min(edgeDistance, segmentDistance(vUv, e, f));
        edgeDistance = min(edgeDistance, segmentDistance(vUv, f, a));
        float outside = max(
          max((b.x - a.x) * (vUv.y - a.y) - (b.y - a.y) * (vUv.x - a.x),
              (c.x - b.x) * (vUv.y - b.y) - (c.y - b.y) * (vUv.x - b.x)),
          max(
            max((d.x - c.x) * (vUv.y - c.y) - (d.y - c.y) * (vUv.x - c.x),
                (e.x - d.x) * (vUv.y - d.y) - (e.y - d.y) * (vUv.x - d.x)),
            max((f.x - e.x) * (vUv.y - e.y) - (f.y - e.y) * (vUv.x - e.x),
                (a.x - f.x) * (vUv.y - f.y) - (a.y - f.y) * (vUv.x - f.x))
          )
        );
        edgeDistance *= outside <= 0.0 ? 1.0 : -1.0;
        float revealDistance = uReveal - vUv.y;
        float apertureDistance = min(edgeDistance, revealDistance);
        float flow = 0.0;
        if (apertureDistance < 0.12) {
          flow = portalFlow(vUv, uTime);
        }
        float displacement = flow * 0.016;
        float portalMask = smoothstep(0.002 + displacement, 0.052 + displacement, apertureDistance);
        if (portalMask <= 0.002) discard;
        vec2 projectedUv = gl_FragCoord.xy / uViewportSize;
        vec3 sceneColor = texture2D(uMap, projectedUv).rgb;
        vec3 fallback = vec3(0.0);
        if (uInterior > 0.0) {
          vec2 p = (vUv - .5) * vec2(1., 1.5);
          float r = length(p), a = atan(p.y, p.x);
          float drift = portalFlow(vUv * 1.8, uTime * .24) * .045 * uTurbulence;
          float detail = portalFlow(vUv * 5.2, uTime * .12);
          float fold = pow(.5 + .5 * sin(r * 114. - a * 3. + drift * 58. + detail * 1.3 - uTime * .42), 38.);
          float cloud = .5 + .5 * portalFlow(vUv * 2.4, uTime * .17);
          float throat = smoothstep(.09, .37, r + drift);
          fallback = (vec3(.001,.004,.008) + vec3(.008,.034,.055) * cloud * cloud
            + vec3(.018,.13,.21) * fold * cloud) * throat * uEnergy;
        }
        vec3 color = mix(fallback, sceneColor, uHasTexture);
        float rim = 1.0 - smoothstep(0.014, 0.082, apertureDistance - displacement * 0.2);
        float shimmer = 0.78 + 0.22 * sin(uTime * 3.7 + vUv.x * 23.0 + flow * 2.5);
        float flame = pow(max(0.0, sin(vUv.x * 73.0 + flow * 5.0 - uTime * 4.5)), 3.0);
        color += vec3(0.04, 0.44, 0.65) * rim * (shimmer + flame * 0.45) * uEnergy;
        gl_FragColor = vec4(color, portalMask * uCameraFade);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: true,
  })
  const portalGeometry = makePortalSurfaceGeometry(width, height)

  // The portal image is visually opaque through most of its aperture, but it is
  // rendered transparently. Prime depth for its solid interior so base props hidden
  // behind the open portal do not burn fragment work before the portal is composited.
  const depthOccluderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uReveal: portalMaterial.uniforms.uReveal,
      uCameraFade: portalMaterial.uniforms.uCameraFade,
      uShape: portalMaterial.uniforms.uShape,
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uReveal;
      uniform float uCameraFade;
      uniform vec3 uShape;
      varying vec2 vUv;

      float segmentDistance(vec2 p, vec2 a, vec2 b) {
        vec2 segment = b - a;
        float t = clamp(dot(p - a, segment) / dot(segment, segment), 0.0, 1.0);
        return length(p - (a + segment * t));
      }

      void main() {
        if (uCameraFade < 0.98) discard;
        float topCut = uShape.x * 0.5;
        float bottomCut = uShape.y * 0.5;
        float sideY = 0.5 + uShape.z * 0.5;
        vec2 a = vec2(topCut, 1.0);
        vec2 b = vec2(1.0 - topCut, 1.0);
        vec2 c = vec2(1.0, sideY);
        vec2 d = vec2(1.0 - bottomCut, 0.0);
        vec2 e = vec2(bottomCut, 0.0);
        vec2 f = vec2(0.0, sideY);
        float edgeDistance = segmentDistance(vUv, a, b);
        edgeDistance = min(edgeDistance, segmentDistance(vUv, b, c));
        edgeDistance = min(edgeDistance, segmentDistance(vUv, c, d));
        edgeDistance = min(edgeDistance, segmentDistance(vUv, d, e));
        edgeDistance = min(edgeDistance, segmentDistance(vUv, e, f));
        edgeDistance = min(edgeDistance, segmentDistance(vUv, f, a));
        float outside = max(
          max((b.x - a.x) * (vUv.y - a.y) - (b.y - a.y) * (vUv.x - a.x),
              (c.x - b.x) * (vUv.y - b.y) - (c.y - b.y) * (vUv.x - b.x)),
          max(
            max((d.x - c.x) * (vUv.y - c.y) - (d.y - c.y) * (vUv.x - c.x),
                (e.x - d.x) * (vUv.y - d.y) - (e.y - d.y) * (vUv.x - d.x)),
            max((f.x - e.x) * (vUv.y - e.y) - (f.y - e.y) * (vUv.x - e.x),
                (a.x - f.x) * (vUv.y - f.y) - (a.y - f.y) * (vUv.x - f.x))
          )
        );
        if (outside > 0.0) discard;
        // Keep the animated translucent rim out of the depth mask.
        if (min(edgeDistance, uReveal - vUv.y) < 0.025) discard;
        gl_FragColor = vec4(0.0);
      }
    `,
    side: THREE.DoubleSide,
    colorWrite: false,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
  })
  const depthOccluder = new THREE.Mesh(portalGeometry, depthOccluderMaterial)
  depthOccluder.name = `${name}DepthOccluder`
  depthOccluder.renderOrder = -10
  depthOccluder.visible = false
  group.add(depthOccluder)

  const core = new THREE.Mesh(portalGeometry, portalMaterial)
  core.renderOrder = 12
  group.add(core)

  const mirroredPortalMaterial = portalMaterial.clone()
  mirroredPortalMaterial.side = THREE.FrontSide
  const mirroredCore = new THREE.Mesh(portalGeometry, mirroredPortalMaterial)
  mirroredCore.renderOrder = 12
  mirroredCore.visible = false
  group.add(mirroredCore)

  const veilMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 0.24 },
      uReveal: { value: 1 },
      uCameraFade: { value: 1 },
      uShape: {
        value: new THREE.Vector3(initialTopCornerCut, initialBottomCornerCut, initialSidePointOffset),
      },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform float uReveal;
      uniform float uCameraFade;
      uniform vec3 uShape;
      varying vec2 vUv;

      void main() {
        if (uCameraFade <= 0.01) discard;
        if (vUv.y > uReveal) discard;
        float topCut = uShape.x * 0.5;
        float bottomCut = uShape.y * 0.5;
        float sideY = 0.5 + uShape.z * 0.5;
        vec2 a = vec2(topCut, 1.0);
        vec2 b = vec2(1.0 - topCut, 1.0);
        vec2 c = vec2(1.0, sideY);
        vec2 d = vec2(1.0 - bottomCut, 0.0);
        vec2 e = vec2(bottomCut, 0.0);
        vec2 f = vec2(0.0, sideY);
        float outside = max(
          max((b.x - a.x) * (vUv.y - a.y) - (b.y - a.y) * (vUv.x - a.x),
              (c.x - b.x) * (vUv.y - b.y) - (c.y - b.y) * (vUv.x - b.x)),
          max(
            max((d.x - c.x) * (vUv.y - c.y) - (d.y - c.y) * (vUv.x - c.x),
                (e.x - d.x) * (vUv.y - d.y) - (e.y - d.y) * (vUv.x - d.x)),
            max((f.x - e.x) * (vUv.y - e.y) - (f.y - e.y) * (vUv.x - f.x),
                (a.x - f.x) * (vUv.y - f.y) - (a.y - f.y) * (vUv.x - f.x))
          )
        );
        if (outside > 0.0) discard;
        gl_FragColor = vec4(vec3(0.02), uOpacity * uCameraFade);
      }
    `,
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  })
  const veil = new THREE.Mesh(portalGeometry, veilMaterial)
  veil.renderOrder = 13
  veil.visible = false
  group.add(veil)

  const mirroredVeilMaterial = veilMaterial.clone()
  mirroredVeilMaterial.side = THREE.BackSide
  const mirroredVeil = new THREE.Mesh(portalGeometry, mirroredVeilMaterial)
  mirroredVeil.renderOrder = 13
  mirroredVeil.visible = false
  group.add(mirroredVeil)

  let elapsed = 0
  const update = (dt: number) => {
    elapsed += Math.max(0, dt)
    portalMaterial.uniforms.uTime.value = elapsed
    mirroredPortalMaterial.uniforms.uTime.value = elapsed
  }
  const setShape = (topCornerCut: number, bottomCornerCut: number, sidePointOffset: number) => {
    portalMaterial.uniforms.uShape.value.set(topCornerCut, bottomCornerCut, sidePointOffset)
    mirroredPortalMaterial.uniforms.uShape.value.set(topCornerCut, bottomCornerCut, sidePointOffset)
    veilMaterial.uniforms.uShape.value.set(topCornerCut, bottomCornerCut, sidePointOffset)
    mirroredVeilMaterial.uniforms.uShape.value.set(topCornerCut, bottomCornerCut, sidePointOffset)
  }

  return {
    group,
    update,
    setShape,
    viewSurface: core,
    mirroredViewSurface: mirroredCore,
    veilSurface: veil,
    mirroredVeilSurface: mirroredVeil,
    depthOccluder,
  }
}