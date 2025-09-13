<template>
  <div>
    <!-- Фон three.js -->
    <canvas
      ref="bgCanvas"
      class="fixed inset-0 z-0 w-full h-full pointer-events-none"
    ></canvas>

    <!-- Весь контент поверх -->
    <div class="relative z-10">
      <RouterView />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { initNebula, type NebulaHandle } from './lib/nebula'

/* Курсор (NDC) */
const mouse = reactive({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
function onMouse(e: MouseEvent) { mouse.x = e.clientX; mouse.y = e.clientY }
function onTouch(e: TouchEvent) { const t = e.touches[0]; if (!t) return; mouse.x = t.clientX; mouse.y = t.clientY }

/* Сглаженный boost от скорости прокрутки (как было) */
let boost = 0, boostTarget = 0, rafBoost = 0
let speedEMA = 0
let lastScrollY = window.scrollY
let lastScrollT = performance.now()
const EMA_ALPHA = 0.25
function clamp01(v: number) { return Math.max(0, Math.min(1, v)) }

/* Орбита камеры — привязка к абсолютной позиции скролла */
function setOrbitFromScroll() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const p = clamp01(window.scrollY / max)
  nebula?.setOrbitProgress(p)
}

function onScroll() {
  const now = performance.now()
  const dy = window.scrollY - lastScrollY
  const dt = Math.min(0.25, Math.max(1 / 120, (now - lastScrollT) / 1000))
  const speed = Math.abs(dy) / dt
  speedEMA += EMA_ALPHA * (speed - speedEMA)
  boostTarget = clamp01(speedEMA / 2200)
  lastScrollY = window.scrollY
  lastScrollT = now

  setOrbitFromScroll()
}
function tickBoost() {
  boost += (boostTarget - boost) * 0.08
  boost *= 0.985
  nebula?.setBoost(boost)
  rafBoost = requestAnimationFrame(tickBoost)
}

/* Nebula init */
const bgCanvas = ref<HTMLCanvasElement | null>(null)
let nebula: NebulaHandle | null = null

onMounted(() => {
  window.addEventListener('mousemove', onMouse, { passive: true })
  window.addEventListener('touchmove', onTouch, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })

  if (bgCanvas.value) nebula = initNebula(bgCanvas.value)

  // стартовые значения
  const x = (mouse.x / window.innerWidth) * 2 - 1
  const y = -(mouse.y / window.innerHeight) * 2 + 1
  nebula?.setMouseNDC(x, y)
  setOrbitFromScroll()
  nebula?.setBoost(0)

  tickBoost()

  // отправляем NDC в рендер (обновляем каждый кадр)
  const onFrame = () => {
    const nx = (mouse.x / window.innerWidth) * 2 - 1
    const ny = -(mouse.y / window.innerHeight) * 2 + 1
    nebula?.setMouseNDC(nx, ny)
    requestAnimationFrame(onFrame)
  }
  requestAnimationFrame(onFrame)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafBoost)
  window.removeEventListener('mousemove', onMouse)
  window.removeEventListener('touchmove', onTouch)
  window.removeEventListener('scroll', onScroll)
  nebula?.dispose()
})
</script>
