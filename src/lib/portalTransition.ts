import { ref } from 'vue'

export const portalJumpActive = ref(false)

let jumpInProgress = false

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export async function playPortalJump() {
  if (jumpInProgress) return
  jumpInProgress = true
  try {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lowPower = document.documentElement.classList.contains('low-power')
    const duration = reduceMotion || lowPower ? 120 : 1280

    portalJumpActive.value = true
    await sleep(duration)
  } finally {
    portalJumpActive.value = false
    jumpInProgress = false
  }
}
