import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import Support from './pages/Support.vue'
import Agassu from './pages/Agassu.vue'
import Legal from './pages/Legal.vue'
import Privacy from './pages/Privacy.vue'
import Account from './pages/Account.vue'
import Login from './pages/Login.vue';
import DebugSupabase from './pages/DebugSupabase.vue';
import { supabase } from './lib/superbase';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/support', component: Support },
    { path: '/games/agassu', component: Agassu },
    { path: '/legal', component: Legal },
    { path: '/privacy', component: Privacy },
       { path: '/login', component: Login },
    { path: '/account', component: Account, meta: { auth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },

    { path: '/debug/supabase', component: DebugSupabase },
  ],
  // ВАЖНО: убираем нативное плавное поведение — им занимается Lenis
  scrollBehavior() {
    return { left: 0, top: 0 } // без behavior:'smooth'
  },
})
router.beforeEach(async (to) => {
  if (!to.meta.auth) return true;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return '/login';
  return true;
});

export default router;