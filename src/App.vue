<template>
  <div>
    <div v-if="portalJumpActive" class="portal-jump-overlay" aria-hidden="true">
      <div class="portal-jump-bg"></div>
      <div class="portal-jump-vortex"></div>
      <div class="portal-jump-lensing"></div>
      <div class="portal-jump-ring ring-a"></div>
      <div class="portal-jump-ring ring-b"></div>
      <div class="portal-jump-ring ring-c"></div>
      <div class="portal-jump-core"></div>
      <div class="portal-jump-dust dust-a"></div>
      <div class="portal-jump-dust dust-b"></div>
      <div class="portal-jump-streaks"></div>
      <div class="portal-jump-flash"></div>
    </div>

    <canvas
      v-if="showNebulaCanvas"
      ref="bgCanvas"
      class="fixed inset-0 z-0 w-full h-full pointer-events-none"
    ></canvas>


    <div class="relative z-10 min-h100">

      <AppHeader
        @signin="openAuth('signin')"
        @signup="openAuth('signup')"
      />

      <RouterView v-slot="{ Component }">
        <component
          :is="Component"
          @signin="openAuth('signin')"
          @signup="openAuth('signup')"
        />
      </RouterView>

      <Transition name="modal-fade" appear>
        <div v-if="authOpen" class="fixed inset-0 z-30 grid place-items-center bg-black/60" @click.self="closeAuth">
          <div class="card w-[92vw] max-w-md p-6 md:p-8 relative auth-card">
            <button class="absolute right-3 top-3 text-white/60 hover:text-white" @click="closeAuth">✕</button>
            <div class="flex items-center gap-3 mb-6">
              <button
                :class="['glass-btn comet', { 'comet-active': mode==='signin' }, ...tabClass('signin')]"
                @click="mode='signin'"
              >
                Sign in
              </button>

              <button
                :class="['glass-btn comet', { 'comet-active': mode==='signup' }, ...tabClass('signup')]"
                @click="mode='signup'"
              >
                Sign up
              </button>
            </div>

            <Transition name="tab-swap" mode="out-in">
              <form :key="mode" @submit.prevent="onSubmit" class="space-y-4">
                <div v-if="mode==='signup'">
                  <label class="block text-sm mb-1">Username</label>
                  <input
                    v-model.trim="form.username"
                    type="text"
                    class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
                    placeholder="your_nickname"
                    :disabled="pending"
                  />
                  <p v-if="errors.username" class="text-red-400 text-xs mt-1">{{ errors.username }}</p>
                </div>

                <div>
                  <label class="block text-sm mb-1">Email</label>
                  <input
                    v-model.trim="form.email"
                    type="email"
                    class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
                    placeholder="you@example.com"
                    :disabled="pending"
                  />
                  <p v-if="errors.email" class="text-red-400 text-xs mt-1">{{ errors.email }}</p>
                </div>
                <div>
                  <label class="block text-sm mb-1">Password</label>
                  <input
                    v-model.trim="form.password"
                    :type="showPass ? 'text' : 'password'"
                    class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
                    placeholder="••••••••"
                    :disabled="pending"
                  />
                  <p v-if="errors.password" class="text-red-400 text-xs mt-1">{{ errors.password }}</p>
                </div>

                <div v-if="mode==='signup'">
                  <label class="block text-sm mb-1">Confirm password</label>
                  <input
                    v-model.trim="form.confirm"
                    :type="showPass ? 'text' : 'password'"
                    class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
                    placeholder="••••••••"
                    :disabled="pending"
                  />
                  <p v-if="errors.confirm" class="text-red-400 text-xs mt-1">{{ errors.confirm }}</p>
                </div>

                <div class="flex items-center justify-between pt-2">
                  <label class="flex items-center gap-2 text-sm text-white/70">
                    <input type="checkbox" v-model="showPass" class="accent-eter-accent" :disabled="pending" /> Show password
                  </label>
                  <button type="submit" class="cta" :disabled="pending">
                    {{ pending ? (mode==='signin' ? 'Signing in…' : 'Creating…') : (mode==='signin' ? 'Sign in' : 'Create account') }}
                  </button>
                </div>
                <div class="flex items-center justify-between">
                  <button
                    v-if="mode==='signin'"
                    type="button"
                    class="text-sm text-white/70 hover:text-white underline underline-offset-2"
                    @click="sendResetEmail"
                    :disabled="pending"
                  >
                    Forgot password?
                  </button>
                </div>
                <p v-if="submitError" class="text-red-400 text-sm">{{ submitError }}</p>
                <p v-if="submitInfo" class="text-green-400 text-sm">{{ submitInfo }}</p>

                <div class="pt-2">
                  <div class="text-center text-xs uppercase tracking-wider text-white/50 mb-3">or continue with</div>
                  <div class="grid grid-cols-1">
                    <button type="button" class="glass-btn w-full auth-google-btn" @click="oauth('google')" :disabled="pending">
                      <svg class="auth-google-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
                      </svg>
                      <span>Google</span>
                    </button>
                    <!-- <button type="button" class="glass-btn w-full" @click="oauth('apple')" :disabled="pending">Apple</button> -->
                  </div>
                </div>
              </form>
            </Transition>
          </div>
        </div>
      </Transition>
<UiPopup
  :open="showVerifyPopup"
  title="Check your email"
  :message="`We've sent a confirmation link to <b>${form.email}</b>.<br />Please confirm your account and then sign in.`"
  button-label="OK"
  @close="showVerifyPopup = false"
/>


      <!-- Глобальный оверлей-спинер на время запросов -->
      <UiSpinner :overlay="true" :open="pending" :label="mode==='signin' ? 'Signing in…' : 'Working…'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from './components/site/AppHeader.vue'
import { useAuth } from './composables/useAuth'
import UiPopup from './components/UiPopup.vue'
import UiSpinner from './components/UiSpinner.vue'
import type { NebulaHandle } from './lib/nebula'
import { portalJumpActive } from './lib/portalTransition'
import './assets/styles/home.css'

const router = useRouter()
const route = useRoute()
const nebulaAllowed = ref(false)
const showNebulaCanvas = computed(() => false)
function clamp01(v: number) { return Math.max(0, Math.min(1, v)) }

function setOrbitFromScroll() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const p = clamp01(window.scrollY / max)
  nebula?.setOrbitProgress(p)
}

function onScroll() {
  setOrbitFromScroll()
}

const bgCanvas = ref<HTMLCanvasElement | null>(null)
let nebula: NebulaHandle | null = null
let nebulaLoadCancelled = false
let authStateSub: { unsubscribe: () => void } | null = null
let nebulaScrollBound = false

async function getSupabase() {
  const mod = await import('./lib/superbase')
  return mod.supabase
}

function runWhenIdle(cb: () => void) {
  const ric = (window as Window & {
    requestIdleCallback?: (callback: () => void) => number
  }).requestIdleCallback
  if (ric) {
    ric(cb)
    return
  }
  window.setTimeout(cb, 120)
}

function runAfterStartup(cb: () => void) {
  window.setTimeout(() => runWhenIdle(cb), 1800)
}

async function initNebulaLazy() {
  if (!bgCanvas.value || nebulaLoadCancelled || nebula) return
  const { initNebula } = await import('./lib/nebula')
  if (!bgCanvas.value || nebulaLoadCancelled || nebula) return
  nebula = initNebula(bgCanvas.value)
  nebula?.setMouseEnabled(false)
  setOrbitFromScroll()
}

function disposeNebula() {
  nebulaLoadCancelled = true
  nebula?.dispose()
  nebula = null
}

function bindNebulaScroll() {
  if (nebulaScrollBound) return
  window.addEventListener('scroll', onScroll, { passive: true })
  nebulaScrollBound = true
}

function unbindNebulaScroll() {
  if (!nebulaScrollBound) return
  window.removeEventListener('scroll', onScroll)
  nebulaScrollBound = false
}

function evaluateNebulaCapability() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const saveData = 'connection' in navigator && !!(navigator as Navigator & {
    connection?: { saveData?: boolean }
  }).connection?.saveData
  const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4

  nebulaAllowed.value = !reducedMotion && !coarsePointer && !saveData && !lowCpu && window.innerWidth >= 1024
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeAuth()
}
async function bindAuthEvents() {
  const supabase = await getSupabase()
  const { data: sub } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') authOpen.value = false
    if (event === 'PASSWORD_RECOVERY') window.location.assign('/reset')
  })
  authStateSub = sub?.subscription ?? null
}
onMounted(() => {
  evaluateNebulaCapability()
  if (route.path === '/reset') void bindAuthEvents()
  else runWhenIdle(() => { void bindAuthEvents() })
})

watch(showNebulaCanvas, (enabled) => {
  if (enabled) {
    nebulaLoadCancelled = false
    bindNebulaScroll()
    runAfterStartup(() => { void initNebulaLazy() })
    return
  }

  unbindNebulaScroll()
  disposeNebula()
}, { immediate: true, flush: 'post' })

onBeforeUnmount(() => {
  unbindNebulaScroll()
  authStateSub?.unsubscribe()
  window.removeEventListener('keydown', onKey)
  disposeNebula()
})

type Mode = 'signin' | 'signup'
const { isAuthed, signIn, signUp, signOut } = useAuth()

const authOpen = ref(false)
const mode = ref<Mode>('signin')
const showPass = ref(false)
const form = reactive({ email: '', password: '', confirm: '', username: '' })
const errors = reactive<{ email?: string; password?: string; confirm?: string; username?: string }>({})
const submitError = ref('')
const submitInfo = ref('')
const showVerifyPopup = ref(false)
const pending = ref(false)

watch(authOpen, (open) => {
  if (open) {
    window.addEventListener('keydown', onKey)
    return
  }
  window.removeEventListener('keydown', onKey)
})

function tabClass(k: Mode) {
  return [
    'px-4 py-2 rounded-xl border text-sm',
    mode.value === k
      ? 'bg-eter-accent/20 border-eter-accent/40'
      : 'bg-white/5 border-white/10 hover:bg-white/10'
  ]
}
function openAuth(nextMode: Mode) {
  mode.value = nextMode
  authOpen.value = true
  submitError.value = ''
  submitInfo.value = ''
  errors.email = errors.password = errors.confirm = errors.username = undefined
}
function closeAuth() { authOpen.value = false }

function validate(): boolean {
  errors.email = errors.password = errors.confirm = errors.username = undefined
  submitError.value = ''
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const unameRx = /^[a-zA-Z0-9_.-]{3,20}$/
  if (!form.email || !emailRx.test(form.email)) errors.email = 'Enter a valid email'
  if (!form.password || form.password.length < 8) errors.password = 'Min 8 characters'
  if (mode.value === 'signup') {
    if (!form.username) errors.username = 'Enter a username'
    else if (!unameRx.test(form.username)) errors.username = '3–20 letters, digits, _ . -'
    if (!form.confirm) errors.confirm = 'Confirm your password'
    if (!errors.password && form.confirm !== form.password) errors.confirm = 'Passwords do not match'
  }
  return !errors.email && !errors.password && !errors.confirm && !errors.username
}

async function onSubmit() {
  if (!validate()) return
  submitError.value = ''
  submitInfo.value = ''
  pending.value = true
  try {
    if (mode.value === 'signin') {
      await signIn(form.email, form.password)
      authOpen.value = false
      router.push('/account')
      return
    }

    const uname = form.username.trim()
    const supabase = await getSupabase()

    const { data: existing, error: existsErr } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', uname.replace(/([\\%_])/g, '\\$1'))
      .maybeSingle()

    if (existsErr?.code === 'PGRST205') {
      submitError.value = 'Profiles table is not initialized. Run the SQL migration and reload schema.'
      return
    }
    if (existsErr && existsErr.code !== 'PGRST116') throw existsErr
    if (existing?.id) { errors.username = 'Username is taken'; return }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { desired_username: uname },
        emailRedirectTo: window.location.origin
      }
    })
    if (error) throw error

    if (!data.session) {
      showVerifyPopup.value = true
      authOpen.value = false
      return
    }

    authOpen.value = false
    router.push('/account')
  } catch (e: any) {
    submitError.value = e?.message ?? 'Auth error'
  } finally {
    pending.value = false
  }
}

async function sendResetEmail() {
  submitError.value = ''
  submitInfo.value = ''
  if (!form.email) {
    errors.email = 'Enter your email to reset'
    return
  }
  try {
    pending.value = true
    const supabase = await getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/reset`
    } as any)
    if (error) throw error
    submitInfo.value = 'We\'ve sent a reset link to your email.'
  } catch (e: any) {
    submitError.value = e?.message ?? 'Failed to send reset email'
  } finally {
    pending.value = false
  }
}

async function oauth(provider: 'google' ) {
  submitError.value = ''
  submitInfo.value = ''
  try {
    pending.value = true
    const supabase = await getSupabase()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    })
    if (error) throw error
    // Browser navigates to provider; no further action here
  } catch (e: any) {
    submitError.value = e?.message ?? 'OAuth error'
  } finally {
    pending.value = false
  }
}

async function logout() {
  try {
    pending.value = true
    await signOut()
    router.push('/')
  } finally {
    pending.value = false
  }
}
</script>

<style scoped>
.portal-jump-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(ellipse at 50% 52%, rgba(32, 18, 58, 0.16), rgba(4, 5, 10, 0.86) 64%, rgba(0, 0, 0, 0.98) 100%),
    rgba(0, 0, 0, 0.72);
  animation: portalOverlayFade 1280ms cubic-bezier(.16,.78,.28,1) both;
}

.portal-jump-bg {
  position: absolute;
  inset: -18%;
  z-index: 0;
  background:
    radial-gradient(ellipse at 50% 52%, rgba(244, 192, 255, 0.22), rgba(171, 78, 255, 0.18) 15%, rgba(63, 139, 255, 0.09) 34%, rgba(0, 0, 0, 0) 58%),
    radial-gradient(ellipse at 44% 56%, rgba(255, 76, 238, 0.18), rgba(0, 0, 0, 0) 42%),
    radial-gradient(ellipse at 56% 48%, rgba(78, 173, 255, 0.12), rgba(0, 0, 0, 0) 46%);
  filter: blur(18px) saturate(1.2);
  animation: portalFieldZoom 1280ms cubic-bezier(.16,.78,.28,1) both;
}

.portal-jump-vortex,
.portal-jump-lensing,
.portal-jump-core,
.portal-jump-streaks,
.portal-jump-flash,
.portal-jump-dust,
.portal-jump-ring {
  position: absolute;
  left: 50%;
  top: 52%;
  transform: translate(-50%, -50%);
}

.portal-jump-vortex {
  z-index: 1;
  width: 420px;
  height: 520px;
  border-radius: 50%;
  background:
    conic-gradient(
      from 18deg,
      rgba(0, 0, 0, 0) 0deg,
      rgba(255, 80, 238, 0.2) 34deg,
      rgba(90, 160, 255, 0.1) 76deg,
      rgba(0, 0, 0, 0) 118deg,
      rgba(244, 182, 255, 0.18) 178deg,
      rgba(0, 0, 0, 0) 236deg,
      rgba(85, 205, 255, 0.12) 302deg,
      rgba(0, 0, 0, 0) 360deg
    );
  filter: blur(7px);
  opacity: 0;
  mix-blend-mode: screen;
  animation: portalVortex 1280ms cubic-bezier(.16,.78,.28,1) both;
}

.portal-jump-lensing {
  z-index: 2;
  width: 340px;
  height: 430px;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at center, rgba(0, 0, 0, 0.94) 0 23%, rgba(45, 13, 62, 0.5) 24% 31%, rgba(236, 158, 255, 0.3) 32% 34%, rgba(78, 173, 255, 0.15) 36% 43%, rgba(0, 0, 0, 0) 58%);
  box-shadow:
    inset 0 0 48px rgba(0, 0, 0, 0.92),
    0 0 36px rgba(233, 117, 255, 0.36),
    0 0 94px rgba(78, 173, 255, 0.18);
  opacity: 0;
  animation: portalLens 1280ms cubic-bezier(.16,.78,.28,1) both;
}

.portal-jump-core {
  z-index: 4;
  width: 200px;
  height: 260px;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.96) 0 3%, rgba(244, 192, 255, 0.76) 8%, rgba(188, 106, 255, 0.46) 24%, rgba(25, 7, 38, 0.94) 42%, rgba(0, 0, 0, 0) 66%);
  box-shadow:
    inset 0 0 36px rgba(0, 0, 0, 0.9),
    0 0 46px rgba(206, 110, 255, 0.72),
    0 0 132px rgba(106, 160, 255, 0.32);
  opacity: 0;
  animation: portalCoreDive 1280ms cubic-bezier(.14,.82,.26,1) both;
}

.portal-jump-ring {
  z-index: 5;
  border-radius: 50%;
  border: 1px solid rgba(232, 170, 255, 0.72);
  box-shadow:
    0 0 18px rgba(232, 170, 255, 0.34),
    inset 0 0 18px rgba(100, 172, 255, 0.12);
  opacity: 0;
}

.ring-a {
  width: 300px;
  height: 380px;
  clip-path: polygon(12% 0, 85% 2%, 100% 18%, 96% 82%, 82% 100%, 16% 96%, 0 78%, 4% 16%);
  animation: portalRingWarp 1280ms cubic-bezier(.14,.82,.26,1) both;
}

.ring-b {
  width: 390px;
  height: 500px;
  border-color: rgba(133, 186, 255, 0.46);
  clip-path: polygon(16% 2%, 76% 0, 100% 24%, 92% 78%, 70% 100%, 18% 94%, 0 72%, 7% 18%);
  animation: portalRingWarp 1280ms cubic-bezier(.14,.82,.26,1) both;
  animation-delay: 80ms;
}

.ring-c {
  width: 220px;
  height: 285px;
  border-color: rgba(255, 226, 184, 0.52);
  clip-path: polygon(20% 0, 84% 8%, 98% 35%, 90% 88%, 62% 100%, 8% 78%, 0 24%);
  animation: portalInnerRing 1280ms cubic-bezier(.14,.82,.26,1) both;
  animation-delay: 30ms;
}

.portal-jump-streaks {
  inset: -34%;
  left: auto;
  top: auto;
  transform: none;
  z-index: 3;
  background: repeating-conic-gradient(
    from 0deg at 50% 52%,
    rgba(233, 176, 255, 0.23) 0deg 1.4deg,
    rgba(129, 177, 255, 0.16) 1.4deg 2.2deg,
    rgba(0, 0, 0, 0) 2.2deg 10deg
  );
  mask-image: radial-gradient(ellipse at 50% 52%, transparent 0 16%, rgba(0,0,0,.92) 25%, transparent 74%);
  filter: blur(0.8px);
  opacity: 0;
  animation: portalStreaksDive 1280ms cubic-bezier(.14,.82,.26,1) both;
}

.portal-jump-dust {
  z-index: 6;
  width: 720px;
  height: 720px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 18% 35%, rgba(255,255,255,.75) 0 1px, transparent 1.4px),
    radial-gradient(circle at 72% 28%, rgba(188, 210, 255,.7) 0 1px, transparent 1.5px),
    radial-gradient(circle at 52% 78%, rgba(255, 190, 248,.72) 0 1px, transparent 1.3px),
    radial-gradient(circle at 38% 54%, rgba(255,255,255,.45) 0 1px, transparent 1.2px);
  background-size: 62px 62px, 84px 84px, 74px 74px, 46px 46px;
  opacity: 0;
  mix-blend-mode: screen;
  animation: portalDustIn 1280ms cubic-bezier(.16,.78,.28,1) both;
}

.dust-b {
  width: 980px;
  height: 980px;
  background-size: 96px 96px, 128px 128px, 110px 110px, 72px 72px;
  filter: blur(0.7px);
  animation-name: portalDustFar;
}

.portal-jump-flash {
  inset: 0;
  left: auto;
  top: auto;
  transform: none;
  z-index: 8;
  background:
    radial-gradient(ellipse at 50% 52%, rgba(255,255,255,0.98) 0 8%, rgba(236, 170, 255, 0.5) 12%, rgba(0,0,0,0) 34%),
    rgba(255, 255, 255, 0);
  opacity: 0;
  animation: portalFlash 1280ms cubic-bezier(.16,.78,.28,1) both;
}

@keyframes portalOverlayFade {
  0% { opacity: 0; backdrop-filter: blur(0); }
  10% { opacity: 1; }
  48% { backdrop-filter: blur(2px) saturate(1.1); }
  78% { opacity: 1; backdrop-filter: blur(8px) saturate(1.35); }
  100% { opacity: 0; backdrop-filter: blur(14px) saturate(1.5); }
}

@keyframes portalFieldZoom {
  0% { opacity: 0; transform: scale(0.82) rotate(0deg); }
  14% { opacity: 1; }
  68% { opacity: 1; transform: scale(1.45) rotate(4deg); }
  100% { opacity: 0; transform: scale(2.45) rotate(12deg); }
}

@keyframes portalVortex {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(.55) rotate(-18deg); }
  16% { opacity: .74; }
  58% { opacity: .9; transform: translate(-50%, -50%) scale(1.2) rotate(68deg); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(4.8) rotate(180deg); }
}

@keyframes portalLens {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(.42) rotate(-4deg); filter: blur(8px); }
  14% { opacity: .9; filter: blur(2px); }
  52% { opacity: 1; transform: translate(-50%, -50%) scale(1.05) rotate(4deg); }
  82% { opacity: .96; transform: translate(-50%, -50%) scale(3.2) rotate(16deg); filter: blur(1px); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(7.2) rotate(24deg); filter: blur(10px); }
}

@keyframes portalCoreDive {
  0% { transform: translate(-50%, -50%) scale(.32); opacity: 0; }
  12% { opacity: .92; }
  44% { transform: translate(-50%, -50%) scale(.94); opacity: 1; }
  78% { transform: translate(-50%, -50%) scale(4.6); opacity: .82; }
  100% { transform: translate(-50%, -50%) scale(9.8); opacity: 0; }
}

@keyframes portalRingWarp {
  0% { transform: translate(-50%, -50%) scale(.42) rotate(-8deg); opacity: 0; filter: blur(4px); }
  14% { opacity: .9; filter: blur(0); }
  48% { transform: translate(-50%, -50%) scale(1.06) rotate(22deg); opacity: .96; }
  82% { transform: translate(-50%, -50%) scale(3.5) rotate(82deg); opacity: .58; }
  100% { transform: translate(-50%, -50%) scale(8.2) rotate(122deg); opacity: 0; filter: blur(8px); }
}

@keyframes portalInnerRing {
  0% { transform: translate(-50%, -50%) scale(.35) rotate(20deg); opacity: 0; }
  16% { opacity: 1; }
  55% { transform: translate(-50%, -50%) scale(1.1) rotate(-26deg); opacity: .85; }
  100% { transform: translate(-50%, -50%) scale(7.4) rotate(-120deg); opacity: 0; }
}

@keyframes portalStreaksDive {
  0% { transform: scale(.72) rotate(0deg); opacity: 0; }
  16% { opacity: .6; }
  58% { opacity: .92; transform: scale(1.25) rotate(18deg); }
  100% { transform: scale(2.55) rotate(58deg); opacity: 0; }
}

@keyframes portalDustIn {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(.36) rotate(0deg); }
  18% { opacity: .8; }
  76% { opacity: .74; transform: translate(-50%, -50%) scale(1.7) rotate(60deg); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(4.6) rotate(120deg); }
}

@keyframes portalDustFar {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(.52) rotate(20deg); }
  22% { opacity: .46; }
  76% { opacity: .42; transform: translate(-50%, -50%) scale(1.35) rotate(-40deg); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(3.4) rotate(-90deg); }
}

@keyframes portalFlash {
  0%, 58% { opacity: 0; }
  72% { opacity: .42; }
  84% { opacity: .92; }
  100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .portal-jump-bg,
  .portal-jump-vortex,
  .portal-jump-lensing,
  .portal-jump-core,
  .portal-jump-ring,
  .portal-jump-streaks,
  .portal-jump-dust,
  .portal-jump-flash {
    animation: none !important;
  }
}
</style>


