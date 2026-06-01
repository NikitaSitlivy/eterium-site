import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'
import { router } from './router'

// включаем "режим анимаций" только если JS реально загрузился
document.documentElement.classList.add('js')

const nav = navigator as Navigator & {
  deviceMemory?: number
  connection?: { saveData?: boolean; effectiveType?: string }
}
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const coarsePointer = window.matchMedia('(pointer: coarse)').matches
const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4
const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4
const saveData = !!nav.connection?.saveData
const slowConnection = /(^|-)2g$/.test(nav.connection?.effectiveType ?? '')

if (prefersReducedMotion || coarsePointer || lowCpu || lowMemory || saveData || slowConnection) {
  document.documentElement.classList.add('low-power')
}

createApp(App).use(router).mount('#app')
