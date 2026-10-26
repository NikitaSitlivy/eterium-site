import { onMounted, onBeforeUnmount, type Ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useEditorialMotion(root: Ref<HTMLElement | null>) {
  let media: ReturnType<typeof gsap.matchMedia> | undefined
  let refresh: (() => void) | undefined
  onMounted(() => {
    if (!root.value) return
    media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const distance = innerWidth < 700 ? 22 : 48
      const reveal = (selector: string) => {
        root.value!.querySelectorAll<HTMLElement>(selector).forEach(element => {
          gsap.from(element, {
            y: distance, opacity: 0, duration: .95, ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: element, start: 'top 92%', once: true },
          })
        })
      }
      reveal('.manifesto > *, .places-grid figure, .core-list article, .development-grid article, .threshold h2, .threshold button, .editorial-footer')
      root.value!.querySelectorAll('.editorial-label i').forEach(element => {
        gsap.from(element, { scaleX: 0, transformOrigin: 'left', duration: 1.1, ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 92%', once: true } })
      })
      if (innerWidth >= 900 && !document.documentElement.classList.contains('low-power')) {
        gsap.fromTo('.core-number', { y: 35 }, { y: -35, ease: 'none',
          scrollTrigger: { trigger: '.core-experience', start: 'top bottom', end: 'bottom top', scrub: .8 } })
      }
    }, root.value)
    refresh = () => ScrollTrigger.refresh()
    // Capturing load handles lazy images without a continuous resize/render loop.
    root.value.addEventListener('load', refresh, true)
    document.fonts.ready.then(() => { if (media) ScrollTrigger.refresh() })
  })
  onBeforeUnmount(() => {
    if (refresh) root.value?.removeEventListener('load', refresh, true)
    media?.revert(); media = undefined
  })
}
