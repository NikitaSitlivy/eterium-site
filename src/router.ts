
import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
const Agassu = () => import('./pages/Agassu.vue')

const Support = () => import('./pages/Support.vue')
const Legal = () => import('./pages/Legal.vue')
const Privacy = () => import('./pages/Privacy.vue')
const Account = () => import('./pages/Account.vue')
const Login = () => import('./pages/Login.vue')
const DebugSupabase = () => import('./pages/DebugSupabase.vue')
const Reset = () => import('./pages/Reset.vue')
const Profile = () => import('./pages/Profile.vue')            // ⬅ добавили
const PublicProfile = () => import('./pages/Profile.vue')       // ⬅ тот же компонент
const InventoryPage = () => import('./pages/InventoryPage.vue') 
const Usersage = () => import('./pages/Users.vue') 
const Notifications = () => import('./pages/Notifications.vue')
const Settings = () => import('./pages/Settings.vue')
const Messages = () => import('./pages/Messages.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/support', component: Support },
    { path: '/games/agassu', component: Agassu },
    { path: '/legal', component: Legal },
    { path: '/privacy', component: Privacy },
    { path: '/login', component: Login },
    { path: '/reset', component: Reset },
    { path: '/account', component: Account, meta: { auth: true } },
    { path: '/profile', redirect: '/account' },   
     { path: '/messages', component: Messages, meta: { auth: true } },   
    { path: '/u/:username', component: PublicProfile },     
      { path: '/inventory', name: 'inventory', component: InventoryPage },             
    { path: '/debug/supabase', component: DebugSupabase },
    { path: '/notifications', component: Notifications, meta: { auth: true } },
    { path: '/settings', component: Settings, meta: { auth: true } },
    { path: '/users', component: Usersage, meta: { auth: true }  },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 100 }
    return { left: 0, top: 0 }
  }
})

router.beforeEach(async (to) => {

  if (!to.meta?.auth) return true


  const { supabase } = await import('./lib/superbase')
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  return true
})

router.afterEach((to) => {
  const metadata: Record<string, [string, string]> = {
    '/': ['AGASSU — The stillness is misleading | Eterium', 'Интерактивный 3D-мир AGASSU: энергетический портал, THE BASIN, станция и погодный зал. Браузерный хоррор in development.'],
    '/games/agassu': ['AGASSU — Explore the world | Eterium', 'Explore the world of AGASSU and discover development build 0.2.'],
    '/support': ['Support AGASSU | Eterium', 'Follow the development of AGASSU and share the game with friends.']
  }
  const [title, description] = metadata[to.path] ?? ['Eterium — Account & community', 'Your Eterium account and community.']
  document.title = title
  document.documentElement.lang = 'en'
  document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
})

export default router
