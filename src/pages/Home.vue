<template>
  <div>
    <!-- Top nav -->
    <header class="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-eter-bg/60 bg-eter-bg/80 border-b border-white/5">
      <div class="section flex items-center justify-between py-3">
        <RouterLink to="/" class="font-extrabold text-xl tracking-tight">Eterium</RouterLink>

        <nav class="hidden md:flex items-center gap-4 text-sm">
          <a href="#why"     :class="linkClass('why')">Why Browser-Native</a>
          <a href="#agassu"  :class="linkClass('agassu')">AGASSU</a>
          <RouterLink class="hover:text-white/90" to="/support">Support</RouterLink>
          <RouterLink class="hover:text-white/90" to="/legal">Legal</RouterLink>
        </nav>

        <RouterLink to="/support" class="cta text-sm">Support the Project</RouterLink>
      </div>
    </header>

    <!-- HERO -->
    <section id="hero" class="section min-h-[90vh] grid place-items-center relative will-reveal">
      <div class="blurry-glow -z-10 -top-32 -right-20"></div>
      <div class="text-center space-y-6">
        <h1 class="text-4xl md:text-6xl font-extrabold leading-tight">
          Instant games. In your browser.
        </h1>
        <p class="text-white/70 max-w-2xl mx-auto">
          No installs, no friction — jump in, squad up and play right away.
          Eterium is a browser-native game universe with social features built-in.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="#minigame" class="cta">Play a mini game (soon)</a>
          <a href="#why" class="cta">Why browser-native?</a>
        </div>
      </div>
    </section>

    <!-- WHY -->
    <section id="why" class="section py-24 md:py-32 will-reveal">
      <div class="grid md:grid-cols-2 gap-8 items-center">
        <div class="space-y-4">
          <h2 class="text-3xl md:text-5xl font-extrabold">Why Browser-Native is the Future</h2>
          <p class="text-white/70">
            WebGPU and modern WebGL unlock console-grade visuals on the web — with instant startup,
            cross-device by design. No launchers. No drivers. Just click and play.
          </p>
          <div class="flex gap-3 flex-wrap">
            <span class="px-4 py-2 rounded-full border border-white/10 bg-white/5">Instant startup</span>
            <span class="px-4 py-2 rounded-full border border-white/10 bg-white/5">No installs</span>
            <span class="px-4 py-2 rounded-full border border-white/10 bg-white/5">Cross-platform</span>
            <span class="px-4 py-2 rounded-full border border-white/10 bg-white/5">GPU-powered</span>
          </div>
        </div>

        <div class="card p-6 md:p-8 tilt" :ref="tiltRefs">
          <h3 class="font-semibold text-xl mb-4">What it means for players</h3>
          <ul class="space-y-3 text-white/80">
            <li>• Join friends in seconds — zero friction.</li>
            <li>• Smooth visuals powered by your GPU.</li>
            <li>• Play anywhere: desktop, laptop — even low-end machines.</li>
            <li>• Social features baked in: parties, chat, profiles.</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- AGASSU -->
    <section id="agassu" class="section py-24 md:py-32 will-reveal">
      <div class="grid lg:grid-cols-2 gap-8 items-stretch">
        <div class="card p-6 md:p-8 flex flex-col justify-between tilt" :ref="tiltRefs">
          <div>
            <h2 class="text-3xl md:text-5xl font-extrabold mb-3">AGASSU — in development</h2>
            <p class="text-white/70">
              A third-person co-op roguelike horror with dynamic progression between sessions.
              Procedural tension. Team up to survive and evolve your build run after run.
            </p>
            <div class="mt-4 inline-flex items-center gap-2 text-sm text-eter-glow">
              <span class="inline-block w-2 h-2 rounded-full bg-eter-accent animate-pulse"></span>
              Status: Pre-demo (coming soon)
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <RouterLink class="cta" to="/games/agassu">View game page</RouterLink>
            <a class="cta" href="#roadmap">Follow devlogs</a>
          </div>
        </div>

        <div class="card p-0 overflow-hidden relative tilt" :ref="tiltRefs">
          <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-eter-bg/40 to-transparent"></div>
          <div class="relative h-[360px] md:h-[460px] overflow-hidden">
            <div class="absolute inset-0" v-for="(n, i) in 6" :key="i" :style="carouselSlideStyle(i)"></div>
          </div>
          <div class="p-4 md:p-6 text-sm text-white/60">
            Concept art is AI-generated as a temporary placeholder. Final visuals will evolve during development.
          </div>
        </div>
      </div>
    </section>

    <!-- SUPPORT -->
    <section id="support" class="section py-24 md:py-32 will-reveal">
      <div class="grid md:grid-cols-3 gap-6">
        <div class="md:col-span-2 tilt" :ref="tiltRefs">
          <div class="card p-6 md:p-8">
            <h2 class="text-3xl md:text-5xl font-extrabold mb-4">Support the Project</h2>
            <p class="text-white/70">
              Eterium is for everyone — play and socialize right in the browser, regardless of your PC.
              We’re building a universe of games that launch instantly and bring people together.
              Early backers will receive unique perks as we grow.
            </p>
            <ul class="mt-4 text-white/80 space-y-2">
              <li>• Founder badge on your profile (future).</li>
              <li>• Early access to demos and playtests.</li>
              <li>• Exclusive profile backgrounds and cosmetics.</li>
            </ul>
            <div class="mt-6 flex gap-3">
              <RouterLink class="cta" to="/support">Become a backer</RouterLink>
              <a class="cta" href="#rewards">See future rewards</a>
            </div>
          </div>
        </div>

        <div class="card p-6 md:p-8 tilt" :ref="tiltRefs">
          <h3 class="font-semibold text-xl mb-2">Choose your way</h3>
          <ul class="text-white/80 space-y-2">
            <li>• One-time donation (pay what you want)</li>
            <li>• Monthly backer</li>
            <li>• Tip jar</li>
          </ul>
          <p class="text-xs text-white/50 mt-4">Secure payments via Stripe or Ko-fi.</p>
        </div>
      </div>
    </section>

    <!-- MINI GAME PLACEHOLDER -->
    <section id="minigame" class="section py-24 md:py-32 will-reveal">
      <div class="card p-8 text-center tilt" :ref="tiltRefs">
        <h2 class="text-3xl md:text-5xl font-extrabold">Mini Game — coming soon</h2>
        <p class="text-white/70 mt-2">
          We’re crafting a small, addictive browser game to play instantly on this page.
        </p>
        <button
          class="mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 bg-white/5 border border-white/10 text-white/50 cursor-not-allowed"
          title="Coming soon"
          disabled
        >
          Play now
        </button>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="border-t border-white/5 py-10 mt-10">
      <div class="section flex flex-col md:flex-row items-center justify-between gap-4 text-white/60 text-sm">
        <div>© {{ new Date().getFullYear() }} Eterium</div>
        <nav class="flex gap-4">
          <a href="#why" class="hover:text-white/80">Why</a>
          <RouterLink to="/support" class="hover:text-white/80">Support</RouterLink>
          <RouterLink to="/legal" class="hover:text-white/80">Legal</RouterLink>
        </nav>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'

/* Active nav highlight */
const active = ref<'hero' | 'why' | 'agassu' | 'support' | 'minigame'>('hero')
function linkClass(id: string) {
  return [
    'hover:text-white/90',
    active.value === id ? 'text-white after:block after:h-[2px] after:bg-eter-accent after:mt-1' : 'text-white/75'
  ]
}

/* -------- Reveal (safe) -------- */
let io: IntersectionObserver | null = null
function setupReveal() {
  const vh = window.innerHeight

  // мгновенно раскрываем то, что уже видно
  document.querySelectorAll<HTMLElement>('.will-reveal').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.top < vh * 0.85 && r.bottom > 0) el.classList.add('revealed')
  })

  // наблюдаем остальные
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        (e.target as HTMLElement).classList.add('revealed')
        io?.unobserve(e.target)
      }
    }
  }, { threshold: 0.15 })

  document.querySelectorAll<HTMLElement>('.will-reveal').forEach((el) => {
    if (!el.classList.contains('revealed')) io!.observe(el)
  })
}

/* -------- Активная ссылка в nav -------- */
let ioNav: IntersectionObserver | null = null
function setupNavHighlight() {
  ioNav = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const id = (e.target as HTMLElement).id as typeof active.value
        if (id) active.value = id
      }
    })
  }, { threshold: 0.5 })

  ;['why', 'agassu', 'support', 'minigame'].forEach((id) => {
    const el = document.getElementById(id)
    if (el) ioNav!.observe(el)
  })
}

/* -------- Tilt (vanilla) -------- */
const tiltEls: HTMLElement[] = []

// функция-реф универсальная: Element | ComponentPublicInstance | null
const tiltRefs = (el: Element | ComponentPublicInstance | null) => {
  let node: HTMLElement | null = null
  if (!el) return
  // если передали компонент — берём его $el
  if ((el as ComponentPublicInstance).$el) {
    node = (el as ComponentPublicInstance).$el as HTMLElement
  } else if (el instanceof HTMLElement) {
    node = el
  }
  if (node) tiltEls.push(node)
}

function attachTilt(el: HTMLElement) {
  el.style.transformStyle = 'preserve-3d'
  el.style.transition = 'transform 220ms ease'
  const onMove = (e: MouseEvent) => {
    const r = el.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width - 0.5
    const ny = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(800px) rotateX(${ny * -4}deg) rotateY(${nx * 4}deg)`
  }
  const onLeave = () => { el.style.transform = 'perspective(800px) rotateX(0) rotateY(0)' }
  el.addEventListener('mousemove', onMove)
  el.addEventListener('mouseleave', onLeave)
  return () => {
    el.removeEventListener('mousemove', onMove)
    el.removeEventListener('mouseleave', onLeave)
  }
}
const cleanups: Array<() => void> = []

/* -------- Псевдо-карусель -------- */
const carouselOffset = ref(0)
function carouselSlideStyle(i: number) {
  const hue = 215 + (i * 9)
  const x = ((i * 100) - (carouselOffset.value % 600))
  const scale = 1 + Math.sin((carouselOffset.value * 0.01) + i) * 0.015
  return {
    backgroundImage: `radial-gradient(120% 120% at 70% 30%, rgba(148,180,255,0.35), rgba(10,11,15,0.1) 40%, transparent 70%), linear-gradient(135deg, hsl(${hue},70%,18%), hsl(${hue+10},62%,10%))`,
    transform: `translateX(${x}%) scale(${scale})`,
    transition: 'transform 0.2s linear',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'contrast(1.05) saturate(1.1)',
    willChange: 'transform'
  }
}
let timer: number | null = null

onMounted(() => {
  setupReveal()
  setupNavHighlight()
  tiltEls.forEach((el) => cleanups.push(attachTilt(el)))
  timer = window.setInterval(() => { carouselOffset.value += 1 }, 30)
})

onBeforeUnmount(() => {
  io?.disconnect()
  ioNav?.disconnect()
  cleanups.forEach((fn) => fn())
  if (timer) clearInterval(timer)
})
</script>
