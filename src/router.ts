import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import Support from './pages/Support.vue'
import Agassu from './pages/Agassu.vue'
import Legal from './pages/Legal.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/support', component: Support },
    { path: '/games/agassu', component: Agassu },
    { path: '/legal', component: Legal },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  // ВАЖНО: убираем нативное плавное поведение — им занимается Lenis
  scrollBehavior() {
    return { left: 0, top: 0 } // без behavior:'smooth'
  },
})
