
import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from './lib/superbase'

const Home = () => import('./pages/Home.vue')
const Support = () => import('./pages/Support.vue')
const Agassu = () => import('./pages/Agassu.vue')
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
    { path: '/profile', component: Profile, meta: { auth: true } },   
    { path: '/u/:username', component: PublicProfile },     
      { path: '/inventory', name: 'inventory', component: InventoryPage },             
    { path: '/debug/supabase', component: DebugSupabase },
    { path: '/users', component: Usersage },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() { return { left: 0, top: 0 } }
})

router.beforeEach(async (to) => {
  if (!to.meta?.auth) return true
  const { data } = await supabase.auth.getUser()
  if (!data.user) return `/login?redirect=${encodeURIComponent(to.fullPath)}`
  return true
})

export default router
