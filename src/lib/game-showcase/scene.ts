import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { makePortalVisual } from './portal'

export type Weather = 'rain' | 'storm' | 'snow'
export type Showcase = { setLocation: (location: 'pool' | 'portal') => void; setWeather: (weather: Weather) => void; setPaused: (paused: boolean) => void; setQuality: (quality: boolean) => void; dispose: () => void }

/** A presentation scene using AGASSU's actual portal shader, GLB assets and PBR tiles. */
export async function createShowcase(host: HTMLElement, onReady: () => void): Promise<Showcase> {
  const mobile = host.clientWidth < 700
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.15 : 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.3
  renderer.shadowMap.enabled = !mobile
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.domElement.setAttribute('aria-label', 'Interactive AGASSU pool and portal: drag to look around')
  host.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#171d1e')
  scene.fog = new THREE.FogExp2('#374441', .014)
  const camera = new THREE.PerspectiveCamera(46, 1, .1, 150)
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(800,600), .18, .3, 2)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  const textures = new Set<THREE.Texture>()
  const textureLoader = new THREE.TextureLoader()
  let disposed = false, paused = reduced, visible = true, quality = !mobile, selectedWeather: Weather = 'rain', dirty = true
  let location: 'pool' | 'portal' = 'pool', stormStarted = 0
  let mixer: THREE.AnimationMixer | undefined
  let character: THREE.Object3D | undefined
  const ktx = new KTX2Loader().setTranscoderPath('/media/game/').detectSupport(renderer)
  ktx.setWorkerLimit(2)
  const loader = new GLTFLoader().setKTX2Loader(ktx).setMeshoptDecoder(MeshoptDecoder)
  const disposeObject = (root: THREE.Object3D) => root.traverse(o => {
    const mesh = o as THREE.Mesh
    mesh.geometry?.dispose()
    for(const m of mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : []) {
      for(const value of Object.values(m)) if(value instanceof THREE.Texture) value.dispose()
      m.dispose()
    }
  })
  // Material settings follow the game's transitMaterials.ts and buildBasinEnvironment.ts.
  const tile = new THREE.MeshPhysicalMaterial({color:0x969d9f,normalScale:new THREE.Vector2(.45,.45),roughness:.72,metalness:0,clearcoat:.24,clearcoatRoughness:.22,envMapIntensity:.7})
  const poolTile=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,metalness:0,envMapIntensity:.7})
  const metal = new THREE.MeshStandardMaterial({color:0x63777d,roughness:.48,metalness:.38})
  const pale = poolTile
  poolTile.roughness=.68
  const cyan = new THREE.MeshBasicMaterial({color:new THREE.Color(1.3,3.2,3.5),toneMapped:false})
  const amber = new THREE.MeshBasicMaterial({color:new THREE.Color(3, .8, .15),toneMapped:false})
  function box(w:number,h:number,d:number,x:number,y:number,z:number, material:THREE.Material) {
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    // Match the game's three-metre texture coverage on every face, without stretching tiles.
    const unit=material===poolTile?4.5:3
    const uv=m.geometry.getAttribute('uv'),faceSizes=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]]
    for(let face=0;face<6;face++)for(let v=face*4;v<face*4+4;v++)uv.setXY(v,uv.getX(v)*faceSizes[face][0]/unit,uv.getY(v)*faceSizes[face][1]/unit)
    m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=true;scene.add(m);return m
  }
  // A recessed swimming pool, not a reflective plane laid over a floor.
  box(42,.5,54,0,-3.5,-13,poolTile)
  box(10,3.6,54,-14,-1.5,-13,poolTile);box(10,3.6,54,14,-1.5,-13,poolTile)
  box(18,3.6,7,0,-1.5,11.5,poolTile);box(18,3.6,7,0,-1.5,-37.5,poolTile)
  const coping=poolTile
  for(const x of [-9,9]) {box(.55,.25,48,x,.35,-13,coping);box(.09,.04,48,x*.94,.22,-13,metal)}
  for(const z of [8,-34])box(18,.25,.55,0,.35,z,coping)
  for(let z=4;z>=-40;z-=8){
    for(const side of [-1,1]){
      box(1.25,15,1.4,side*13,7.5,z,pale)
      box(1.7,.4,1.9,side*13,.6,z,coping)
      box(.22,.08,4,side*9,13.8,z,new THREE.MeshBasicMaterial({color:0xfff3d9}))
    }
    box(28,.6,1.4,0,15,z,pale)
    box(3,.08,5,0,15.35,z-3,new THREE.MeshBasicMaterial({color:0xc8d3cb}))
  }
  box(.4,16,58,-17,8,-15,pale);box(.4,16,58,17,8,-15,pale)
  box(35,16,.5,0,8,-43,pale)
  box(35,.4,60,0,15.5,-14,metal)
  const benchMaterial=new THREE.MeshStandardMaterial({color:0x202c27,roughness:.65,metalness:.4})
  for(const x of [-14,14])for(const z of [-4,-20,-34]){
    box(1.4,.12,3.4,x,1,z,benchMaterial);box(.12,1,3.4,x+(x<0?-.6:.6),1.5,z,benchMaterial)
    for(const dz of [-1.2,1.2])box(1.2,1,.1,x,.5,z+dz,benchMaterial)
  }
  // Recessed archways give the far end a recognisable liminal silhouette.
  for(const x of [-10,0,10]){
    const arch=new THREE.Shape();arch.moveTo(-2.4,0);arch.lineTo(-2.4,5);arch.absarc(0,5,2.4,Math.PI,0,true);arch.lineTo(2.4,0);arch.closePath()
    const opening=new THREE.Mesh(new THREE.ShapeGeometry(arch),new THREE.MeshBasicMaterial({color:0x192924}));opening.position.set(x,.3,-42.7);scene.add(opening)
    const points=[new THREE.Vector3(x-2.6,.3,-42.6),new THREE.Vector3(x-2.6,5.3,-42.6)]
    for(let i=0;i<=32;i++){const a=Math.PI-i*Math.PI/32;points.push(new THREE.Vector3(x+Math.cos(a)*2.6,5.3+Math.sin(a)*2.6,-42.6))}
    points.push(new THREE.Vector3(x+2.6,.3,-42.6))
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,.13,6,false),coping))
  }
  // Dark lane markers remain visible through the animated water.
  for(const x of [-6,-2,2,6]){box(.18,.02,38,x,-3.23,-13,metal);box(1.4,.02,.2,x,-3.22,5,metal)}
  const railMaterial=new THREE.MeshStandardMaterial({color:0xdde3dd,metalness:.95,roughness:.18})
  for(const z of [4,2.8]) {
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(9.7,.35,z),new THREE.Vector3(9.7,1.6,z),new THREE.Vector3(8.3,1.6,z),new THREE.Vector3(8.3,-1.8,z)])
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve,24,.065,8,false),railMaterial))
  }
  for(let y=-1.5;y<.8;y+=.5)box(.09,.07,1.2,8.3,y,3.4,railMaterial)
  const reflection = new Reflector(new THREE.PlaneGeometry(17.5,41.5), { color:0x82a9a0, textureWidth:mobile?384:1024, textureHeight:mobile?384:1024, clipBias:.004 })
  reflection.rotation.x=-Math.PI/2;reflection.position.set(0,-.25,-13);scene.add(reflection)
  const reflectionMaterial = reflection.material as THREE.ShaderMaterial
  reflectionMaterial.transparent=true
  reflectionMaterial.uniforms.uRipple={value:0}
  reflectionMaterial.uniforms.uStorm={value:0}
  reflectionMaterial.fragmentShader=reflectionMaterial.fragmentShader.replace('void main() {','uniform float uRipple; uniform float uStorm;\nvoid main() {').replace('texture2DProj( tDiffuse, vUv )','texture2DProj( tDiffuse, vUv + vec4((sin(vUv.y * 150. + uRipple * 1.1) + sin(vUv.x * 92. - uRipple)) * (.003 + uStorm*.004) * vUv.w, cos(vUv.x * 115. + uRipple * .8) * .002 * vUv.w, 0., 0.) )').replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );','gl_FragColor = vec4( mix(blendOverlay(base.rgb, color), vec3(.015,.105,.09), .55), 1.0 );')
  const water=new THREE.Mesh(new THREE.PlaneGeometry(17.5,41.5,60,90),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},storm:{value:0}},vertexShader:`varying vec2 uvWater;uniform float time;uniform float storm;void main(){uvWater=uv;vec3 p=position;p.z=sin(p.x*2.+time)*cos(p.y*1.3-time*.7)*(.024+storm*.065);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec2 uvWater;uniform float time;uniform float storm;void main(){vec2 p=uvWater*vec2(35.,83.);float a=sin(p.x+sin(p.y*.7+time*.5))+sin(p.y+sin(p.x*.8-time*.6));float caustic=pow(max(0.,1.-abs(a)*.7),14.);float ripple=pow(max(0.,sin(length(fract(p*.35)-.5)*45.-time*(4.+storm*5.))),24.);gl_FragColor=vec4(.3,.75,.62,caustic*.035+ripple*(.018+storm*.065));}`}))
  water.rotation.x=-Math.PI/2;water.position.set(0,-.22,-13);scene.add(water)
  const lowWater=new THREE.Mesh(new THREE.PlaneGeometry(17.5,41.5),new THREE.MeshStandardMaterial({color:0x226c62,roughness:.24,metalness:.3}))
  lowWater.rotation.x=-Math.PI/2;lowWater.position.set(0,-.28,-13);scene.add(lowWater);lowWater.visible=false
  const poolWorld=new THREE.Group();poolWorld.name='Enclosed swimming pool'
  for(const child of [...scene.children])poolWorld.add(child)
  scene.add(poolWorld)
  const poolLights=new THREE.Group();scene.add(poolLights)
  for(const z of [3,-10,-23,-36])for(const side of [-1,1]){
    const lamp=new THREE.SpotLight(0xffead0,210,30,.64,.65,1.7)
    lamp.position.set(side*9,13.5,z);lamp.target.position.set(side*6,0,z-2)
    lamp.castShadow=!mobile&&z===3;lamp.shadow.mapSize.set(1024,1024);lamp.shadow.bias=-.0002
    poolLights.add(lamp,lamp.target)
  }
  const portalWorld=new THREE.Group();portalWorld.name='Portal station';scene.add(portalWorld);portalWorld.visible=false
  const stationBox=(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>{const mesh=box(w,h,d,x,y,z,m);portalWorld.add(mesh);return mesh}
  stationBox(38,.35,60,0,-.2,-15,tile)
  for(let z=4;z>=-44;z-=9){for(const side of [-1,1]){
    stationBox(1.2,21,1.5,side*13,10.5,z,metal)
    stationBox(.06,9,.08,side*12.37,6,z+.8,cyan)
    stationBox(3,.05,.12,side*8,.01,z,new THREE.MeshBasicMaterial({color:0xd3d4c6}))
  }stationBox(28,.7,1.5,0,21,z,metal)}
  stationBox(.5,23,64,-15,11,-18,metal);stationBox(.5,23,64,15,11,-18,metal);stationBox(31,23,.5,0,11,-48,metal)
  const portal = makePortalVisual('AGASSU_Web_Portal',10.8,6.1,new THREE.Vector3(4,3.65,-7),0)
  portal.viewSurface.material.side=THREE.DoubleSide
  portal.viewSurface.material.uniforms.uInterior.value=1
  portal.viewSurface.material.uniforms.uEnergy.value=3.4
  portalWorld.add(portal.group);portal.group.visible=false
  const frameHolder=new THREE.Group();frameHolder.position.set(4,0,-7.12);portalWorld.add(frameHolder);frameHolder.visible=false
  const ambient=new THREE.HemisphereLight(0xe7ebde,0x244a40,2.3);scene.add(ambient)
  const key=new THREE.SpotLight(0xffefda,160,50,1,.7,1.4)
  key.position.set(1,10,6);key.target.position.set(3,2,-6);key.castShadow=!mobile;key.shadow.mapSize.set(1024,1024);scene.add(key,key.target)
  const portalLight=new THREE.PointLight(0x55e8ff,140,25,1.6);portalLight.position.set(4,3,-4);scene.add(portalLight)
  const rim=new THREE.PointLight(0xd2e6d9,16,25,1.5);rim.position.set(10,4,1);scene.add(rim)
  const lightning=new THREE.DirectionalLight(0xc8e7ff,0);lightning.position.set(-5,20,-20);scene.add(lightning)
  const rainCount=mobile?1600:4000, positions=new Float32Array(rainCount*3)
  for(let i=0;i<rainCount;i++) positions.set([(Math.random()-.5)*36,Math.random()*23,7-Math.random()*47],i*3)
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(positions,3))
  const precipitation=new THREE.ShaderMaterial({
    uniforms:{time:{value:0},snow:{value:0},storm:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`uniform float time;uniform float snow;uniform float storm;varying float strength;void main(){vec3 p=position; p.y=mod(p.y-time*mix(9.+storm*13.,1.1,snow),23.);p.x+=sin(time*.4+position.z)*snow+storm*mod(time*5.+position.y,9.);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(90./max(1.,-mv.z),1.,mix(12.+storm*9.,8.,snow));strength=.35+storm*.4+sin(position.x*7.)*.1;}`,
    fragmentShader:`uniform float snow;varying float strength;void main(){vec2 p=gl_PointCoord-.5;float rain=(1.-smoothstep(.03,.12,abs(p.x)))*(1.-smoothstep(.2,.5,abs(p.y)));float flake=1.-smoothstep(.1,.48,length(p));gl_FragColor=vec4(.62,.85,1.,mix(rain,flake,snow)*strength);}`
  })
  const boltPoints=[[-7,15,-29],[-8,12,-29],[-6,10,-29],[-8,7,-29],[-7,8,-29],[-9,4,-29]].map(p=>new THREE.Vector3(...p as [number,number,number]))
  const bolt=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(boltPoints,false,'catmullrom',0),32,.035,5,false),new THREE.MeshBasicMaterial({color:new THREE.Color(4,5,6),toneMapped:false}));bolt.visible=false;portalWorld.add(bolt)
  const rain=new THREE.Points(rainGeo,precipitation);rain.frustumCulled=false;portalWorld.add(rain)
  const streakPositions=new Float32Array(rainCount*6),tails=new Float32Array(rainCount*2)
  for(let i=0;i<rainCount;i++){streakPositions.set(positions.subarray(i*3,i*3+3),i*6);streakPositions.set(positions.subarray(i*3,i*3+3),i*6+3);tails[i*2+1]=1}
  const streakGeo=new THREE.BufferGeometry();streakGeo.setAttribute('position',new THREE.BufferAttribute(streakPositions,3));streakGeo.setAttribute('tail',new THREE.BufferAttribute(tails,1))
  const streakMaterial=new THREE.ShaderMaterial({uniforms:{time:{value:0},storm:{value:0}},transparent:true,depthWrite:false,vertexShader:`uniform float time;uniform float storm;attribute float tail;void main(){vec3 p=position;float fall=mod(position.y-time*(9.+storm*14.),23.);p.y=fall-tail*(.23+storm*.6);p.x+=storm*(fall*.27-tail*.25);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float storm;void main(){gl_FragColor=vec4(.75,.85,.83,.16+storm*.24);}`})
  const streaks=new THREE.LineSegments(streakGeo,streakMaterial);streaks.frustumCulled=false;portalWorld.add(streaks)
  const dustGeo=new THREE.BufferGeometry(),dustPos=new Float32Array(180*3)
  for(let i=0;i<180;i++) dustPos.set([4+(Math.random()-.5)*9,Math.random()*8,-6+Math.random()*3],i*3)
  dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3))
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0x8df4ff,size:.025,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));portalWorld.add(dust)
  async function loadMaterial(material:THREE.MeshStandardMaterial,name:string){
    await Promise.all(['Color','NormalGL','Roughness'].map(async channel=>{
      const t=await textureLoader.loadAsync('/media/game/materials/'+name+'-'+channel+'.webp')
      if(disposed){t.dispose();return}
      textures.add(t);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy())
      if(channel==='Color'){t.colorSpace=THREE.SRGBColorSpace;material.map=t}
      if(channel==='NormalGL')material.normalMap=t
      if(channel==='Roughness')material.roughnessMap=t
      material.needsUpdate=true;dirty=true
    }))
  }
  void loadMaterial(poolTile,'backrooms').catch(error=>console.warn('AGASSU Backrooms material unavailable',error))
  let portalAssetsStarted=false
  function loadPortalAssets(){
  if(portalAssetsStarted)return
  portalAssetsStarted=true
  void Promise.all([loadMaterial(tile,'transit'),loadMaterial(metal,'metal')]).catch(error=>console.warn('AGASSU station material unavailable',error))
  void loader.loadAsync('/media/game/portal.glb').then(gltf=>{
    if(disposed){disposeObject(gltf.scene);return}
    const model=gltf.scene;let bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3())
    if(size.x<Math.min(size.y,size.z))model.rotation.y=Math.PI/2
    else if(size.y<Math.min(size.x,size.z))model.rotation.x=Math.PI/2
    bounds.setFromObject(model);size=bounds.getSize(new THREE.Vector3())
    const scale=7.6/size.y,center=bounds.getCenter(new THREE.Vector3())
    model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale)
    model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true}})
    frameHolder.add(model)
    dirty=true
  }).catch(error=>console.warn('AGASSU portal frame unavailable',error))
  void loader.loadAsync('/media/game/hero.glb').then(async gltf=>{
    if(disposed){disposeObject(gltf.scene);return}
    const model=gltf.scene
    const animation=(await loader.loadAsync('/media/game/idle.glb')).animations[0]
    if(disposed){disposeObject(model);return}
    if(animation){animation.tracks.forEach(track=>{track.name=track.name.replace(/mixamorig1/g,'mixamorig')});mixer=new THREE.AnimationMixer(model);mixer.clipAction(animation).play();mixer.update(.001)}
    model.updateMatrixWorld(true)
    const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3())
    const scale=3.5/size.y,center=bounds.getCenter(new THREE.Vector3())
    const centered=new THREE.Group();centered.add(model);centered.position.set(-center.x,-bounds.min.y,-center.z)
    const holder=new THREE.Group();holder.position.set(2.3,.08,.5);holder.rotation.y=2.8;holder.scale.setScalar(scale);holder.add(centered);portalWorld.add(holder);character=holder
    model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true}})
    dirty=true
  }).catch(error=>console.warn('AGASSU character unavailable',error))
  }
  let pointerX=0,pointerY=0,dragX=0,downX=0,dragging=false,elapsed=0,last=0,frame=0
  const look=new THREE.Vector3()
  const resize=()=>{
    const w=host.clientWidth,h=host.clientHeight
    if(!w||!h)return
    camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);dirty=true
  }
  const observer=new ResizeObserver(resize);observer.observe(host);resize()
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{threshold:.01});intersection.observe(host)
  const move=(e:PointerEvent)=>{
    const rect=host.getBoundingClientRect();pointerX=(e.clientX-rect.left)/rect.width-.5;pointerY=(e.clientY-rect.top)/rect.height-.5
    if(dragging) {dragX=THREE.MathUtils.clamp(dragX+(e.clientX-downX)*.008,-2.5,2.5);downX=e.clientX}
  }
  const down=(e:PointerEvent)=>{dragging=true;downX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId)}
  const up=()=>{dragging=false}
  host.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',up)
  const tick=(now:number)=>{
    if(disposed)return
    frame=requestAnimationFrame(tick)
    if(now-last<(quality?1000/50:1000/30))return
    const dt=Math.min((now-last)/1000,.05);last=now
    if(!visible||document.hidden||(paused&&!dirty))return
    const weather:Weather|'clear'=location==='portal'?selectedWeather:'clear'
    poolWorld.visible=poolLights.visible=location==='pool';portalWorld.visible=location==='portal'
    if(!paused)elapsed+=dt
    if(!paused&&location==='portal'){portal.update(dt);mixer?.update(dt);dust.rotation.y=Math.sin(elapsed*.2)*.07}
    precipitation.uniforms.time.value=elapsed
    rain.visible=weather==='snow';streaks.visible=weather!=='snow'
    streakMaterial.uniforms.time.value=elapsed;streakMaterial.uniforms.storm.value=weather==='storm'?1:0
    streakGeo.setDrawRange(0,weather==='storm'?rainCount*2:Math.floor(rainCount*.5))
    precipitation.uniforms.storm.value=weather==='storm'?1:0
    rainGeo.setDrawRange(0,weather==='storm'?rainCount:Math.floor(rainCount*.32))
    const waterMaterial=water.material as THREE.ShaderMaterial
    waterMaterial.uniforms.time.value=elapsed;waterMaterial.uniforms.storm.value=weather==='storm'?1:0
    reflectionMaterial.uniforms.uStorm.value=weather==='storm'?1:0
    precipitation.uniforms.snow.value=THREE.MathUtils.damp(precipitation.uniforms.snow.value,weather==='snow'?1:0,2,dt)
    reflectionMaterial.uniforms.uRipple.value=elapsed
    portalLight.intensity=135+Math.sin(elapsed*1.2)*18
    const stormTime=(elapsed-stormStarted)%5.7
    const flash=weather==='storm'&&stormTime<.65?Math.pow(Math.max(0,Math.sin(stormTime*13)),4):0
    lightning.intensity=flash*7;bolt.visible=flash>.1
    ambient.intensity=location==='pool'?.22:weather==='storm'?.45+flash*1.5:1.25
    const fog=scene.fog as THREE.FogExp2
    fog.color.set(location==='pool'?'#111613':weather==='storm'?'#101c26':'#152027');fog.density=location==='pool'?.008:weather==='storm'?.027:.014
    ;(scene.background as THREE.Color).set(location==='pool'?'#171d1e':'#070d12')
    key.intensity=location==='pool'?0:weather==='storm'?45:160
    portal.group.visible=frameHolder.visible=location==='portal'
    portalLight.intensity=location==='portal'?150:0
    const narrow=host.clientWidth<700
    const target=location==='pool'?new THREE.Vector3(narrow?1:-1.8,2.9,narrow?24:18):new THREE.Vector3(narrow?4:1.3,4.7,narrow?20:14)
    target.x+=paused?0:pointerX*1.1+dragX;target.y+=paused?0:pointerY*-.55
    camera.position.lerp(target,.045)
    look.set(location==='pool'?0:narrow?4:1.4,location==='pool'?1:3.15,location==='pool'?-22:-6);camera.lookAt(look)
    if(character)character.visible=location==='portal'
    reflection.visible=quality&&location==='pool'
    lowWater.visible=!quality
    bloom.enabled=quality
    composer.render()
    dirty=false
  }
  camera.position.set(mobile?2:0,3.4,mobile?24:19)
  tick(0);onReady()
  return {
    setLocation(next){location=next;if(next==='portal')loadPortalAssets();dirty=true},
    setWeather(next){selectedWeather=next;stormStarted=elapsed;precipitation.uniforms.snow.value=next==='snow'?1:0;dirty=true},
    setPaused(next){paused=next;dirty=true},
    setQuality(next){quality=next;renderer.setPixelRatio(Math.min(devicePixelRatio,next?1.5:1));resize()},
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();host.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',up);mixer?.stopAllAction();disposeObject(scene);textures.forEach(t=>t.dispose());reflection.getRenderTarget().dispose();composer.dispose();bloom.dispose();ktx.dispose();renderer.dispose();renderer.domElement.remove()}
  }
}
