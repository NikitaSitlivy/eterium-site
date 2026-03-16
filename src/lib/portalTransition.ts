import { ref } from 'vue'

export const portalJumpActive = ref(false)

let jumpInProgress = false

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export async function playPortalJump() {
  if (jumpInProgress) return
  jumpInProgress = true

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const duration = reduceMotion ? 120 : 950

  portalJumpActive.value = true
  await sleep(duration)
  portalJumpActive.value = false

  jumpInProgress = false
}
