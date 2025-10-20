<template>
  <div>
    <section
      id="hero"
      class="relative min-h-[100svh] flex items-center overflow-hidden will-reveal"
    >
      <div
        class="absolute inset-0 bg-cover bg-center scale-105 brightness-[0.7] contrast-[1.15] saturate-[1.2] transition-transform duration-[4000ms] will-change-transform"
      ></div>

      <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 "></div>
      <div class="absolute inset-0 mix-blend-screen bg-[radial-gradient(90%_90%_at_60%_20%,rgba(140,180,255,0.25),transparent_70%)]"></div>

      <div class="relative z-10 section">
        <div class="max-w-4xl">
          <div class="glass-pill mb-6 text-xs w-fit">
            <span class="inline-block w-2 h-2 rounded-full bg-eter-accent animate-pulse"></span>
            Browser-native AAA
          </div>

          <h1
            class="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
          >
            AGASSU — horror roguelike<br class="hidden md:block" />
            that runs <span class="text-eter-accent">instantly</span> in your browser
          </h1>

          <p
            class="mt-5 text-white/80 text-lg md:text-xl max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
          >
            No installs. Squad up in seconds. WebGPU visuals, console-grade feel — click and play.
          </p>

          <div class="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <RouterLink to="/games/agassu" class="glass-btn  comet">View Game</RouterLink>
            <a href="#why" class="glass-btn  comet">Learn More</a>
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
            WebGPU and modern WebGL unlock console-grade visuals on the web — with instant startup,
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
            <li>• Join friends in seconds — zero friction.</li>
            <li>• Smooth visuals powered by your GPU.</li>
            <li>• Play anywhere: desktop, laptop — even low-end machines.</li>
            <li>• Social features baked in: parties, chat, profiles.</li>
          </ul>
        </div>
      </div>
    </section>

    <section id="agassu" class="section py-24 md:py-32 will-reveal">
      <div class="grid lg:grid-cols-2 gap-8 items-stretch">
        <div class="glass-card p-6 md:p-8 flex flex-col justify-between tilt glass-panel" :ref="tiltRefs">
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
            <RouterLink class="glass-btn  comet" to="/games/agassu">View game page</RouterLink>
            <a class="glass-btn  comet" href="#roadmap">Follow devlogs</a>
          </div>
        </div>

        <div class="glass-card p-0 overflow-hidden relative tilt glass-panel" :ref="tiltRefs">
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

    <section id="support" class="section py-24 md:py-32 will-reveal">
      <div class="grid md:grid-cols-3 gap-6">
        <div class="md:col-span-2 tilt" :ref="tiltRefs">
          <div class="glass-card p-6 md:p-8 glass-panel">
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
              <RouterLink class="glass-btn  comet" to="/support">Become a backer</RouterLink>
              <a class="glass-btn  comet" href="#rewards">See future rewards</a>
            </div>
          </div>
        </div>

        <div class="glass-card glass-panel p-6 md:p-8 tilt" :ref="tiltRefs">
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

    <section id="minigame" class="section py-24 md:py-32 will-reveal">
      <div class="glass-card p-8 text-center tilt glass-panel" :ref="tiltRefs">
        <h2 class="text-3xl md:text-5xl font-extrabold">Mini Game — coming soon</h2>
        <p class="text-white/70 mt-2">
          We’re crafting a small, addictive browser game to play instantly on this page.
        </p>
        <button class="glass-btn  comet mt-6" title="Coming soon" disabled>
          Play now
        </button>
      </div>
    </section>

    <footer class="border-t border-white/5 py-10 mt-10">
      <div class="section flex flex-col md:flex-row items-center justify-between gap-4 text-white/60 text-sm">
        <div>© {{ new Date().getFullYear() }} Eterium</div>
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
import { onMounted, onBeforeUnmount, ref } from 'vue'
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
        (e.target as HTMLElement).classList.add('revealed')
        io?.unobserve(e.target)
      }
    }
  }, { threshold: 0.15 })
  document.querySelectorAll<HTMLElement>('.will-reveal').forEach((el) => {
    if (!el.classList.contains('revealed')) io!.observe(el)
  })
}

let ioNav: IntersectionObserver | null = null
function setupNavHighlight() {
  ioNav = new IntersectionObserver(() => {}, { threshold: 0.5 })
  ;['why', 'agassu', 'support', 'minigame'].forEach((id) => {
    const el = document.getElementById(id)
    if (el) ioNav!.observe(el)
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
  const onLeave = () => { el.style.transform = 'perspective(800px) rotateX(0) rotateY(0)' }
  el.addEventListener('mousemove', onMove)
  el.addEventListener('mouseleave', onLeave)
  return () => {
    el.removeEventListener('mousemove', onMove)
    el.removeEventListener('mouseleave', onLeave)
  }
}
const cleanups: Array<() => void> = []

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

<style scoped lang="postcss">
.glass-base {
  @apply border border-white/15 text-white/90 backdrop-blur-2xl;
  background:
    radial-gradient(120% 80% at 15% -10%, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 46%),
    linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.28),
    0 10px 30px rgba(0,0,0,0.45),
    0 2px 8px rgba(0,0,0,0.35);
  position: relative;
}

.glass-base::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 40%) top left / 100% 50% no-repeat,
    radial-gradient(60% 40% at 80% 0%, rgba(165,120,255,0.22), rgba(158,124,255,0) 60%);
  opacity: 0.75;
  mix-blend-mode: screen;
}

.glass-base:hover {
  transform: translateY(-1px);
  border-color: rgba(255,255,255,0.22);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.3),
    0 14px 36px rgba(0,0,0,0.5),
    0 3px 10px rgba(0,0,0,0.35);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}
/* Реалистичная стеклянная карточка */
.glass-card {
  position: relative;
  border-radius: 1.25rem;              /* 20px */
  overflow: hidden;

  /* градиентный бордер через двойной бэкграунд */
  border: 1px solid transparent;
  background:
    linear-gradient(to bottom, rgba(255,255,255,0.28), rgba(255,255,255,0.04)) border-box,  /* бордер-блик */
    radial-gradient(120% 180% at 50% -20%, rgba(255,255,255,0.38), rgba(255,255,255,0) 55%) padding-box, /* верхний «свет» */
    linear-gradient(180deg, rgba(24,26,34,0.55), rgba(24,26,34,0.35) 45%, rgba(10,10,12,0.55) 100%) padding-box; /* стеклянная масса */

  backdrop-filter: blur(18px) saturate(1.35) contrast(1.05);
  -webkit-backdrop-filter: blur(18px) saturate(1.35) contrast(1.05);

  /* глубина и внутренняя тень снизу */
  box-shadow:
    inset 0 0.5px 0 rgba(255,255,255,0.45),       /* тонкий верхний кант */
    inset 0 -1px 0 rgba(0,0,0,0.35),              /* нижний кант */
    0 24px 80px rgba(0,0,0,0.55),                 /* большая тень */
    0 8px 28px rgba(0,0,0,0.40);                  /* ближняя тень */
  color: rgba(255,255,255,0.92);
}

/* верхний бликовый слой + холодный оттенок */
.glass-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0) 42%) top/100% 60% no-repeat,
    radial-gradient(70% 40% at 80% -10%, rgba(120,210,255,0.35), rgba(120,210,255,0) 60%);
  mix-blend-mode: screen;
  opacity: .85;
}

/* лёгкий внутренний виньет + микро-зерно, без base64 */
.glass-card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background:
    radial-gradient(140% 120% at 50% 120%, rgba(0,0,0,0.28), transparent 60%),
    repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0 2px, rgba(255,255,255,0) 2px 4px);
  opacity: .22; /* зерно еле заметно */
}

/* ховер — чуть больше «глубины» и светлее кант */
.glass-card:hover {
  transform: translateY(-1px);
  border-color: rgba(255,255,255,0.22);
  box-shadow:
    inset 0 0.5px 0 rgba(255,255,255,0.55),
    inset 0 -1px 0 rgba(0,0,0,0.4),
    0 28px 90px rgba(0,0,0,0.6),
    0 10px 32px rgba(0,0,0,0.45);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .glass-card, .glass-card:hover { transition: none; transform: none; }
}

.glass-btn.comet {
  @apply glass-base inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-white;
    border-color: rgba(97, 225, 255, .35) !important;
    color: rgba(255, 255, 255, .9) !important;
    background: radial-gradient(100% 80% at 20% -20%, rgba(97, 225, 255, .20) 0, rgba(97, 225, 255, 0) 60%), linear-gradient(180deg, rgba(255, 255, 255, .10), rgba(255, 255, 255, .04));
    box-shadow: inset 0 .5px 0 rgba(255, 255, 255, .35), 0 3px 12px rgba(97, 225, 255, .12);



}

.glass-btn.comet:active {
  transform: translateY(0);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.22),
    0 6px 16px rgba(0,0,0,0.45);
}

.glass-btn.comet:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(165,120,255,0.45),
    0 0 0 6px rgba(165,120,255,0.15);
  border-color: rgba(165,120,255,0.4);
}

.glass-btn.comet[disabled] {
  @apply cursor-not-allowed opacity-60;
  transform: none;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.22),
    0 6px 16px rgba(0,0,0,0.35);
}



@media (prefers-reduced-motion: reduce) {
  .glass-base { transition: none; }
  .glass-base:hover { transform: none; }
}
/* Делает карточку визуально такой же, как glass-btn  comet / glass-pill */
.glass-panel {
  @apply border border-white/15 text-white/90 backdrop-blur-2xl rounded-3xl;
  /* тот же стеклянный фон, что у .glass-base */
  background:
    radial-gradient(120% 80% at 15% -10%, rgba(165,120,255,0.26) 0%, rgba(165,120,255,0) 46%),
    linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05)) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.28),
    0 10px 30px rgba(0,0,0,0.45),
    0 2px 8px rgba(0,0,0,0.35);
  position: relative;
  --tw-backdrop-blur: blur(0px);
}

/* убираем «доп. слои» из базовой glass-card */
.glass-panel::before,
.glass-panel::after {
  content: none !important;
}

/* такой же hover, как у кнопок/пилюль */
.glass-panel:hover {
  transform: translateY(-1px);
  border-color: rgba(255,255,255,0.22);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.30),
    0 14px 36px rgba(0,0,0,0.5),
    0 3px 10px rgba(0,0,0,0.35);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}
/* ===== Комета по бордеру для .glass-btn ===== */
@property --angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.glass-btn.comet {
  position: relative;
  overflow: visible; /* glow может выходить за края */
  border-radius: 22px;
  padding: 8px 12px;
}

/* Яркая «голова» кометы — тонкий пробегающий штрих */
.glass-btn.comet::after {
  content: "";
  position: absolute;
  inset: -2px;                 /* толщина неон-строки */
  border-radius: inherit;
  padding: 2px;                /* толщина обводки */
  background:
    conic-gradient(
      from var(--angle),
      transparent 0deg 330deg,
      rgba(165,120,255,0.95) 345deg,
      rgba(165,120,255,0.15) 360deg
    );
  /* показываем только рамку (вырезаем внутренность) */
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;

  opacity: 0;
  transition: opacity .2s ease;
  pointer-events: none;
}

/* Мягкое свечение-хвост вокруг рамки */
.glass-btn.comet::before {
  content: "";
  position: absolute;
  inset: -6px;                 /* ширина внешнего сияния */
  border-radius: inherit;
  background:
    conic-gradient(
      from calc(var(--angle) - 8deg),
      transparent 0deg 330deg,
      rgba(165,120,255,0.55) 350deg,
      rgba(165,120,255,0.0) 360deg
    );
  filter: blur(8px);
  opacity: 0;
  transition: opacity .2s ease;
  pointer-events: none;
}

.glass-btn.comet:hover::after,
.glass-btn.comet:hover::before,
.glass-btn.comet:focus-visible::after,
.glass-btn.comet:focus-visible::before {
  opacity: 1;
  animation: comet-rotate 1500ms linear infinite;
}

/* чуть быстрее при active */
.glass-btn.comet:active::after,
.glass-btn.comet:active::before {
  animation-duration: 900ms;
}

@keyframes comet-rotate {
  to { --angle: 360deg; }
}

/* a11y: если пользователь просит меньше анимации — отключаем бегущую комету */
@media (prefers-reduced-motion: reduce) {
  .glass-btn.comet::before,
  .glass-btn.comet::after {
    animation: none !important;
    opacity: 0 !important;
  }
}
.glass-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  padding: .28rem .7rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: .8125rem;
  line-height: 1.1;
  letter-spacing: .01em;
  cursor: default;

  /* цвет — как рамка кнопки */
  color: rgba(255,255,255,.88);
  border: 1px solid rgba(165,120,255,.7);
  background:
    radial-gradient(100% 180% at 50% 0%, rgba(165,120,255,.14), rgba(165,120,255,.04) 70%),
    linear-gradient(180deg, rgba(15,25,35,.9), rgba(10,15,25,.9));
  box-shadow:
    inset 0 0 1px rgba(255,255,255,.08),
    0 0 12px rgba(165,120,255,.12);

  transition: color .2s ease, border-color .2s ease, background .2s ease;
}

/* немного «живее» при наведении */
.glass-pill:hover {
  border-color: rgba(165,120,255,.35);
  background:
    radial-gradient(100% 180% at 50% 0%, rgba(165,120,255,.18), rgba(165,120,255,.06) 70%),
    linear-gradient(180deg, rgba(20,30,40,.92), rgba(12,18,28,.92));
  box-shadow:
    0 0 14px rgba(165,120,255,.18);
}

/* можно добавить акцентный вариант */
.glass-pill--accent {
  border-color: rgba(165,120,255,.5);
  background:
    radial-gradient(100% 180% at 50% 0%, rgba(165,120,255,.25), rgba(165,120,255,.08) 70%),
    linear-gradient(180deg, rgba(25,45,55,.95), rgba(15,20,25,.95));
  box-shadow:
    0 0 18px rgba(165,120,255,.25);
}


</style>
