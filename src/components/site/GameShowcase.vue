<template>
  <div ref="showcase" class="game-showcase" :class="{ 'is-immersive': immersive, 'is-storm': location==='portal' && weather==='storm' }">
    <img class="scene-fallback" src="/media/game/weather.webp" alt="AGASSU environment" width="1280" height="720" />
    <div ref="host" class="scene-canvas" :class="{ ready }"></div><div class="scene-shade"></div>
    <div class="scene-topline"><span><b></b> {{ ready ? 'REAL-TIME EXPERIENCE' : failed ? 'ENVIRONMENT PREVIEW' : 'ENTERING THE WORLD' }}</span><span>AN ETERIUM GAME / IN DEVELOPMENT</span></div>
    <div v-if="!immersive" class="scene-copy"><h1 aria-label="AGASSU"><span v-for="(letter,index) in 'AGASSU'" :key="index" aria-hidden="true">{{ letter }}</span></h1><div class="hero-side"><p>Liminal<br />horror<br />exploration</p><i></i><p>Some places<br />should stay<br />forgotten.</p></div><button ref="enterButton" class="reference-enter" @click="setImmersive(true)">Enter<br />the<br />scene<span>⟶</span></button></div>
    <button v-if="immersive" ref="exitButton" class="scene-exit" @click="setImmersive(false)">← Back to the surface</button>
    <div class="scene-location" role="group" aria-label="3D environment"><button :aria-pressed="location==='pool'" @click="setLocation('pool')"><span>01</span> The pool</button><button :aria-pressed="location==='portal'" @click="setLocation('portal')"><span>02</span> The portal</button></div>
    <div class="scene-controls"><div v-if="location==='portal'" class="weather-controls" role="group" aria-label="Weather"><button v-for="w in weathers" :key="w.id" :aria-pressed="weather === w.id" @click="setWeather(w.id)"><span>{{ w.icon }}</span>{{ w.label }}</button></div><p v-if="location==='pool'" class="pool-status">ENCLOSED POOL / STILL WATER, UNQUIET SPACE</p><div class="scene-settings"><button :aria-pressed="paused" @click="togglePause">{{ paused ? 'Resume motion' : 'Pause motion' }}</button><button :aria-pressed="quality" @click="toggleQuality">{{ quality ? 'Quality: high' : 'Quality: light' }}</button></div></div>
    <p class="scene-instruction">{{ immersive ? 'DRAG TO LOOK AROUND · ESC TO RETURN' : 'MOVE YOUR CURSOR. FEEL THE SPACE.' }}</p>
    <p v-if="failed" class="scene-error" role="status">3D is unavailable on this device. Showing a game capture.</p>
  </div>
</template>
<script setup lang="ts">
import { onMounted,onBeforeUnmount,ref,nextTick } from 'vue'
import { gsap } from 'gsap'
import type { Showcase,Weather } from '../../lib/game-showcase/scene'
const host=ref<HTMLElement|null>(null),ready=ref(false),failed=ref(false),immersive=ref(false),paused=ref(false),quality=ref(true),weather=ref<Weather>('rain'),location=ref<'pool'|'portal'>('pool')
const weathers=[{id:'rain' as const,label:'Rain',icon:'╱'},{id:'storm' as const,label:'Thunderstorm',icon:'ϟ'},{id:'snow' as const,label:'Snow',icon:'✳'}]
let scene:Showcase|undefined,unmounted=false
const showcase=ref<HTMLElement|null>(null),enterButton=ref<HTMLButtonElement|null>(null),exitButton=ref<HTMLButtonElement|null>(null)
let motion:ReturnType<typeof gsap.matchMedia>|undefined
let transition:gsap.core.Tween|undefined
let switching=false
function revealTitle(){
  motion?.revert();motion=gsap.matchMedia()
  if(!showcase.value)return
  motion.add('(prefers-reduced-motion: no-preference)',()=>{
    gsap.timeline({defaults:{ease:'power3.out'}})
      .from('.scene-copy h1>span',{y:36,opacity:0,duration:1.3,stagger:.11,clearProps:'transform,opacity'})
      .from('.hero-side',{y:15,opacity:0,duration:.8,clearProps:'transform,opacity'},.55)
      .from('.reference-enter',{clipPath:'inset(100% 0 0 0)',duration:.9,clearProps:'clipPath'},.7)
  },showcase.value)
}
async function setImmersive(value:boolean){
  if(switching||value===immersive.value)return
  switching=true
  motion?.revert()
  const current=showcase.value?.querySelector(value?'.scene-copy':'.scene-exit')
  if(current&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    await new Promise<void>(resolve=>{transition=gsap.to(current,{opacity:0,y:value?-16:0,duration:.35,ease:'power2.inOut',onComplete:resolve,onInterrupt:resolve})})
  }
  if(unmounted)return
  immersive.value=value;await nextTick()
  showcase.value?.scrollIntoView({block:'start',behavior:'instant'})
  ;(value?exitButton:enterButton).value?.focus({preventScroll:true})
  if(!value)revealTitle()
  else if(!matchMedia('(prefers-reduced-motion: reduce)').matches)transition=gsap.from(exitButton.value,{opacity:0,duration:.4,clearProps:'opacity'})
  switching=false
}
function setLocation(next:'pool'|'portal'){location.value=next;scene?.setLocation(next)}
function setWeather(next:Weather){weather.value=next;scene?.setWeather(next)}
function togglePause(){paused.value=!paused.value;scene?.setPaused(paused.value)}
function toggleQuality(){quality.value=!quality.value;scene?.setQuality(quality.value)}
function onKey(e:KeyboardEvent){if(e.key==='Escape'&&immersive.value)void setImmersive(false)}
onMounted(async()=>{
 revealTitle()
 paused.value=matchMedia('(prefers-reduced-motion: reduce)').matches;quality.value=innerWidth>=700;window.addEventListener('keydown',onKey)
 try{const {createShowcase}=await import('../../lib/game-showcase/scene');if(unmounted||!host.value)return;const handle=await createShowcase(host.value,()=>{ready.value=true});if(unmounted)handle.dispose();else {scene=handle;scene.setLocation(location.value);scene.setWeather(weather.value);scene.setPaused(paused.value);scene.setQuality(quality.value)}}
 catch(e){failed.value=true;console.warn('AGASSU showcase could not start',e)}
})
onBeforeUnmount(()=>{unmounted=true;transition?.kill();motion?.revert();scene?.dispose();window.removeEventListener('keydown',onKey)})
defineExpose({enter:(next:'pool'|'portal'='pool')=>{setLocation(next);void setImmersive(true)}})
</script>
