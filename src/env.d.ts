/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@studio-freight/lenis' {
  export default class Lenis {
    constructor(opts?: {
      lerp?: number
      smoothWheel?: boolean
      wheelMultiplier?: number
    })
    raf(time: number): void
    on(event: string, cb: (...args: any[]) => void): void
    destroy(): void
  }
}
