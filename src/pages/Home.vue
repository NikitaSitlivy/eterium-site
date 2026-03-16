<template>
  <div>
    <section
      id="hero"
      class="relative min-h-[100svh] flex items-center overflow-hidden will-reveal"
    >
      <div
        class="absolute inset-0 bg-cover bg-center scale-105 brightness-[0.72] contrast-[1.12] saturate-[1.15] transition-transform duration-[4000ms] will-change-transform"
        style="background-image: url('/media/main-bg.png'); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.98) 48%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,0.35) 86%, transparent 100%); mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.98) 48%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,0.35) 86%, transparent 100%)"
      ></div>

      <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/20"></div>
      <div class="absolute inset-x-0 bottom-0 h-56 md:h-80 bg-gradient-to-t from-[#07080b] via-[#07080b]/85 to-transparent"></div>
      <div class="absolute inset-0 mix-blend-screen"></div>

      <div class="relative z-10 section">
        <div class="max-w-4xl">
          <div class="glass-pill mb-6 text-xs w-fit">
            <span class="inline-block w-2 h-2 rounded-full bg-eter-accent animate-pulse"></span>
            Browser-native AAA
          </div>

          <h1
            class="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
          >
            AGASSU - horror roguelike<br class="hidden md:block" />
            that runs <span class="text-eter-accent">instantly</span> in your browser
          </h1>

          <p
            class="mt-5 text-white/80 text-lg md:text-xl max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
          >
            No installs. Squad up in seconds. WebGPU visuals, console-grade feel - click and play.
          </p>

          <div class="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <RouterLink to="/games/agassu" class="glass-btn comet">Enter the Portal</RouterLink>
            <a href="#why" class="glass-btn comet">Play Instantly</a>
          </div>

          <div class="mt-10 flex flex-wrap items-center gap-2 text-sm">
            <span class="glass-pill">Instant startup</span>
            <span class="glass-pill">Zero installs</span>
            <span class="glass-pill">WebGPU powered</span>
            <span class="glass-pill">Cross-device</span>
          </div>
        </div>
      </div>

      <div class="pointer-events-none absolute inset-0 border-t border-l border-r border-white/5"></div>
    </section>

    <section id="why" class="section py-24 md:py-32 will-reveal">
      <div class="grid md:grid-cols-2 gap-8 items-center">
        <div class="space-y-4">
          <h2 class="text-3xl md:text-5xl font-extrabold">Why Browser-Native is the Future</h2>
          <p class="text-white/70">
            WebGPU and modern WebGL unlock console-grade visuals on the web - with instant startup,
            cross-device by design. No launchers. No drivers. Just click and play.
          </p>
          <div class="flex gap-3 flex-wrap">
            <span class="glass-pill">Instant startup</span>
            <span class="glass-pill">No installs</span>
            <span class="glass-pill">Cross-platform</span>
            <span class="glass-pill">GPU-powered</span>
          </div>
        </div>

        <div class="glass-card glass-panel p-6 md:p-8 tilt" :ref="tiltRefs">
          <h3 class="font-semibold text-xl mb-4">What it means for players</h3>
          <ul class="space-y-3 text-white/80">
            <li>- Join friends in seconds with zero friction.</li>
            <li>- Smooth visuals powered by your GPU.</li>
            <li>- Play anywhere: desktop, laptop, and lower-end machines.</li>
            <li>- Social features baked in: parties, chat, profiles.</li>
          </ul>
        </div>
      </div>
    </section>

    <section id="agassu" class="section py-24 md:py-32 will-reveal">
      <div class="grid lg:grid-cols-2 gap-8 items-stretch">
        <div class="glass-card p-6 md:p-8 flex flex-col justify-between tilt glass-panel" :ref="tiltRefs">
          <div>
            <h2 class="text-3xl md:text-5xl font-extrabold mb-3">AGASSU - in development</h2>
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
            <RouterLink class="glass-btn comet" to="/games/agassu">View game page</RouterLink>
            <a class="glass-btn comet" href="#devlog">Follow devlogs</a>
          </div>
        </div>

        <div class="glass-card p-0 overflow-hidden relative tilt glass-panel" :ref="tiltRefs">
          <div class="portal-visual relative h-[360px] md:h-[460px] overflow-hidden">
            <div class="portal-aura"></div>
            <div class="portal-core"></div>
            <div class="portal-ring ring-1"></div>
            <div class="portal-ring ring-2"></div>
            <div class="portal-particles">
              <span
                v-for="n in 18"
                :key="`portal-particle-${n}`"
                class="particle"
                :style="portalParticleStyle(n)"
              ></span>
            </div>
            <div class="water-light"></div>
          </div>
          <div class="p-4 md:p-6 text-sm text-white/60">
            Energy Rift preview. Final in-game portal VFX will be integrated during production.
          </div>
        </div>
      </div>
    </section>

    <section id="support" class="section py-24 md:py-32 will-reveal">
      <div class="grid md:grid-cols-3 gap-6">
        <div class="md:col-span-2 tilt" :ref="tiltRefs">
          <div class="glass-card p-6 md:p-8 glass-panel" id="devlog">
            <h2 class="text-3xl md:text-5xl font-extrabold mb-4">Support the Project</h2>
            <p class="text-white/70">
              Eterium is for everyone - play and socialize right in the browser, regardless of your PC.
              We are building a universe of games that launch instantly and bring people together.
              Early backers will receive unique perks as we grow.
            </p>
            <ul class="mt-4 text-white/80 space-y-2">
              <li>- Founder badge on your profile (future).</li>
              <li>- Early access to demos and playtests.</li>
              <li>- Exclusive profile backgrounds and cosmetics.</li>
            </ul>
            <div class="mt-6 flex gap-3">
              <RouterLink class="glass-btn comet" to="/support">Become a backer</RouterLink>
              <a class="glass-btn comet" href="#rewards">See future rewards</a>
            </div>
          </div>
        </div>

        <div class="glass-card glass-panel p-6 md:p-8 tilt" :ref="tiltRefs">
          <h3 class="font-semibold text-xl mb-2">Choose your way</h3>
          <ul class="text-white/80 space-y-2">
            <li>- One-time donation (pay what you want)</li>
            <li>- Monthly backer</li>
            <li>- Tip jar</li>
          </ul>
          <p class="text-xs text-white/50 mt-4">Secure payments via Stripe or Ko-fi.</p>
        </div>
      </div>
    </section>

    <section id="minigame" class="section py-24 md:py-32 will-reveal">
      <div class="glass-card p-8 text-center tilt glass-panel" :ref="tiltRefs">
        <h2 class="text-3xl md:text-5xl font-extrabold">Play the Prologue</h2>
        <p class="text-white/70 mt-2">
          Enter the First Rift and test a fast AGASSU vertical slice right in the browser.
        </p>
        <RouterLink to="/games/agassu" class="glass-btn comet mt-6">Enter the First Rift</RouterLink>
      </div>
    </section>

    <footer class="border-t border-white/5 py-10 mt-10">
      <div class="section flex flex-col md:flex-row items-center justify-between gap-4 text-white/60 text-sm">
        <div>&copy; {{ new Date().getFullYear() }} Eterium</div>
        <nav class="flex gap-4">
          <a href="#why" class="hover:text-white/80">Why</a>
          <RouterLink to="/support" class="hover:text-white/80">Support</RouterLink>
          <RouterLink to="/legal" class="hover:text-white/80">Legal</RouterLink>
          <RouterLink to="/privacy" class="hover:text-white/80">Privacy</RouterLink>
        </nav>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { RouterLink } from 'vue-router'

let io: IntersectionObserver | null = null
function setupReveal() {
  const vh = window.innerHeight
  document.querySelectorAll<HTMLElement>('.will-reveal').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.top < vh * 0.85 && r.bottom > 0) el.classList.add('revealed')
  })
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        ;(e.target as HTMLElement).classList.add('revealed')
        io?.unobserve(e.target)
      }
    }
  }, { threshold: 0.15 })
  document.querySelectorAll<HTMLElement>('.will-reveal').forEach((el) => {
    if (!el.classList.contains('revealed')) io?.observe(el)
  })
}

let ioNav: IntersectionObserver | null = null
function setupNavHighlight() {
  ioNav = new IntersectionObserver(() => {}, { threshold: 0.5 })
  ;['why', 'agassu', 'support', 'minigame'].forEach((id) => {
    const el = document.getElementById(id)
    if (el) ioNav?.observe(el)
  })
}

const tiltEls: HTMLElement[] = []
const tiltRefs = (el: Element | ComponentPublicInstance | null) => {
  let node: HTMLElement | null = null
  if (!el) return
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
  const onLeave = () => {
    el.style.transform = 'perspective(800px) rotateX(0) rotateY(0)'
  }
  el.addEventListener('mousemove', onMove)
  el.addEventListener('mouseleave', onLeave)
  return () => {
    el.removeEventListener('mousemove', onMove)
    el.removeEventListener('mouseleave', onLeave)
  }
}

const cleanups: Array<() => void> = []

function portalParticleStyle(i: number) {
  const seed = i * 37
  const x = (seed % 84) + 8
  const size = 2 + (seed % 4)
  const delay = (seed % 11) * 0.2
  const duration = 3.6 + (seed % 7) * 0.4
  return {
    left: `${x}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

onMounted(() => {
  setupReveal()
  setupNavHighlight()
  tiltEls.forEach((el) => cleanups.push(attachTilt(el)))
})

onBeforeUnmount(() => {
  io?.disconnect()
  ioNav?.disconnect()
  cleanups.forEach((fn) => fn())
})
</script>

<style scoped lang="postcss">
.portal-visual {
  background:
    radial-gradient(120% 100% at 50% 0%, rgba(188,108,255,0.2) 0%, rgba(8,10,16,0) 52%),
    linear-gradient(180deg, rgba(11,12,22,0.92), rgba(8,9,15,0.96));
}
.portal-aura {
  position: absolute;
  left: 50%;
  top: 42%;
  width: 320px;
  height: 320px;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  filter: blur(30px);
  background: radial-gradient(circle, rgba(188,108,255,0.4) 0%, rgba(124,180,255,0.18) 40%, rgba(0,0,0,0) 72%);
  animation: portalPulse 3.6s ease-in-out infinite;
}
.portal-core {
  position: absolute;
  left: 50%;
  top: 42%;
  width: 170px;
  height: 206px;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  background:
    radial-gradient(55% 70% at 48% 40%, rgba(239,172,255,0.94), rgba(188,108,255,0.58) 42%, rgba(75,114,255,0.25) 70%, rgba(0,0,0,0) 100%),
    radial-gradient(75% 85% at 50% 55%, rgba(116,238,255,0.38), rgba(0,0,0,0) 70%);
  box-shadow:
    inset 0 0 24px rgba(255,255,255,0.44),
    0 0 48px rgba(188,108,255,0.56),
    0 0 80px rgba(84,160,255,0.32);
  animation: portalBreath 2.8s ease-in-out infinite;
}
.portal-ring {
  position: absolute;
  left: 50%;
  top: 42%;
  border-radius: 9999px;
  border: 1px solid rgba(219,154,255,0.44);
  transform: translate(-50%, -50%);
}
.ring-1 {
  width: 210px;
  height: 260px;
  animation: portalSpin 10s linear infinite;
}
.ring-2 {
  width: 240px;
  height: 290px;
  border-color: rgba(122,181,255,0.34);
  animation: portalSpinReverse 14s linear infinite;
}
.portal-particles {
  position: absolute;
  inset: 12% 8% 24%;
}
.particle {
  position: absolute;
  bottom: 0;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(232,188,255,0.94), rgba(132,180,255,0.7));
  box-shadow: 0 0 10px rgba(188,108,255,0.72);
  animation-name: particleRise;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.water-light {
  position: absolute;
  left: -10%;
  right: -10%;
  bottom: -28px;
  height: 170px;
  background:
    radial-gradient(70% 78% at 50% 24%, rgba(152,118,255,0.34), rgba(99,149,255,0.14) 55%, rgba(0,0,0,0) 72%),
    repeating-linear-gradient(95deg, rgba(188,108,255,0.14) 0 12px, rgba(92,140,255,0.08) 12px 24px);
  filter: blur(7px);
  transform: perspective(220px) rotateX(68deg);
  opacity: 0.9;
  animation: waterShimmer 4.4s ease-in-out infinite;
}
@keyframes portalPulse {
  0%, 100% { opacity: .66; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
}
@keyframes portalBreath {
  0%, 100% { transform: translate(-50%, -50%) scale(.96); }
  50% { transform: translate(-50%, -50%) scale(1.03); }
}
@keyframes portalSpin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
@keyframes portalSpinReverse {
  from { transform: translate(-50%, -50%) rotate(360deg); }
  to { transform: translate(-50%, -50%) rotate(0deg); }
}
@keyframes particleRise {
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: .9; }
  100% { transform: translateY(-280px); opacity: 0; }
}
@keyframes waterShimmer {
  0%, 100% { opacity: .76; transform: perspective(220px) rotateX(68deg) scaleX(1); }
  50% { opacity: 1; transform: perspective(220px) rotateX(68deg) scaleX(1.06); }
}

@media (prefers-reduced-motion: reduce) {
  .portal-aura,
  .portal-core,
  .portal-ring,
  .particle,
  .water-light {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
</style>
