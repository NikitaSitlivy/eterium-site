<template>
  <div>
    <div v-if="portalJumpActive" class="portal-jump-overlay" aria-hidden="true">
      <div class="portal-jump-bg"></div>
      <div class="portal-jump-ring ring-a"></div>
      <div class="portal-jump-ring ring-b"></div>
      <div class="portal-jump-core"></div>
      <div class="portal-jump-streaks"></div>
    </div>

    <canvas
      ref="bgCanvas"
      class="fixed inset-0 z-0 w-full h-full pointer-events-none"
    ></canvas>


    <div class="relative z-10 min-h100">

      <SiteHeader
        :isAuthed="isAuthed"
        @signin="openAuth('signin')"
        @signup="openAuth('signup')"
        @logout="logout"
      />

      <RouterView />

      <Transition name="modal-fade" appear>
        <div v-if="authOpen" class="fixed inset-0 z-30 grid place-items-center bg-black/60">
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
                    <button type="button" class="glass-btn w-full" @click="oauth('google')" :disabled="pending">Google</button>
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
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import SiteHeader from './components/SiteHeader.vue'
import { useAuth } from './composables/useAuth'
import UiPopup from './components/UiPopup.vue'
import UiSpinner from './components/UiSpinner.vue'
import { supabase } from './lib/superbase'
import type { NebulaHandle } from './lib/nebula'
import { portalJumpActive } from './lib/portalTransition'

const router = useRouter()

const mouse = reactive({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
function onMouse(e: MouseEvent) { mouse.x = e.clientX; mouse.y = e.clientY }
function onTouch(e: TouchEvent) { const t = e.touches[0]; if (!t) return; mouse.x = t.clientX; mouse.y = t.clientY }

let boost = 0, boostTarget = 0, rafBoost = 0
let speedEMA = 0
let lastScrollY = window.scrollY
let lastScrollT = performance.now()
const EMA_ALPHA = 0.25
function clamp01(v: number) { return Math.max(0, Math.min(1, v)) }

function setOrbitFromScroll() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const p = clamp01(window.scrollY / max)
  nebula?.setOrbitProgress(p)
}

function onScroll() {
  const now = performance.now()
  const dy = window.scrollY - lastScrollY
  const dt = Math.min(0.25, Math.max(1 / 120, (now - lastScrollT) / 1000))
  const speed = Math.abs(dy) / dt
  speedEMA += EMA_ALPHA * (speed - speedEMA)
  boostTarget = clamp01(speedEMA / 2200)
  lastScrollY = window.scrollY
  lastScrollT = now
  setOrbitFromScroll()
}
function tickBoost() {
  boost += (boostTarget - boost) * 0.08
  boost *= 0.985
  nebula?.setBoost(boost)
  rafBoost = requestAnimationFrame(tickBoost)
}

const bgCanvas = ref<HTMLCanvasElement | null>(null)
let nebula: NebulaHandle | null = null
let nebulaLoadCancelled = false
let authStateSub: { unsubscribe: () => void } | null = null

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

async function initNebulaLazy() {
  if (!bgCanvas.value || nebulaLoadCancelled || nebula) return
  const { initNebula } = await import('./lib/nebula')
  if (!bgCanvas.value || nebulaLoadCancelled || nebula) return
  nebula = initNebula(bgCanvas.value)
  nebula?.setMouseEnabled(false)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeAuth()
}
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKey)
  runWhenIdle(() => { void initNebulaLazy() })

  const { data: sub } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      authOpen.value = false
      // сюда можно добавить тост «Welcome back»
    }
    if (event === 'PASSWORD_RECOVERY') {
      window.location.assign('/reset')
    }
  })
  authStateSub = sub?.subscription ?? null
})


onBeforeUnmount(() => {
  nebulaLoadCancelled = true
  authStateSub?.unsubscribe()
  cancelAnimationFrame(rafBoost)
  window.removeEventListener('mousemove', onMouse)
  window.removeEventListener('touchmove', onTouch)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKey)
  nebula?.dispose()
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
  background: radial-gradient(circle at 50% 52%, rgba(16, 13, 31, 0.45), rgba(4, 5, 10, 0.98) 72%);
}

.portal-jump-bg {
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(circle at 50% 52%, rgba(220, 146, 255, 0.36), rgba(95, 144, 255, 0.24) 22%, rgba(0, 0, 0, 0) 50%),
    radial-gradient(circle at 50% 52%, rgba(201, 122, 255, 0.6), rgba(201, 122, 255, 0) 34%);
  filter: blur(16px);
  animation: jumpZoom 920ms cubic-bezier(.18,.74,.32,1) both;
}

.portal-jump-core {
  position: absolute;
  left: 50%;
  top: 52%;
  width: 220px;
  height: 280px;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  background:
    radial-gradient(58% 65% at 50% 46%, rgba(244, 192, 255, 0.95), rgba(188, 106, 255, 0.64) 42%, rgba(89, 148, 255, 0.26) 72%, rgba(0, 0, 0, 0) 100%);
  box-shadow:
    0 0 52px rgba(206, 110, 255, 0.8),
    0 0 108px rgba(106, 160, 255, 0.34);
  animation: coreDive 920ms cubic-bezier(.18,.74,.32,1) both;
}

.portal-jump-ring {
  position: absolute;
  left: 50%;
  top: 52%;
  border: 1px solid rgba(232, 170, 255, 0.65);
  border-radius: 9999px;
  transform: translate(-50%, -50%);
}

.ring-a {
  width: 290px;
  height: 350px;
  animation: ringPulse 920ms ease-out both;
}

.ring-b {
  width: 360px;
  height: 430px;
  border-color: rgba(133, 186, 255, 0.46);
  animation: ringPulse 920ms ease-out both;
  animation-delay: 80ms;
}

.portal-jump-streaks {
  position: absolute;
  inset: -30%;
  background: repeating-conic-gradient(
    from 0deg at 50% 52%,
    rgba(233, 176, 255, 0.18) 0deg 3deg,
    rgba(129, 177, 255, 0.14) 3deg 6deg,
    rgba(0, 0, 0, 0) 6deg 14deg
  );
  filter: blur(1px);
  animation: streaksDive 920ms ease-in both;
}

@keyframes jumpZoom {
  0% { opacity: 0; transform: scale(0.8); }
  22% { opacity: 1; }
  100% { opacity: 1; transform: scale(1.9); }
}

@keyframes coreDive {
  0% { transform: translate(-50%, -50%) scale(.42); opacity: 0; }
  18% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(6.4); opacity: 0.06; }
}

@keyframes ringPulse {
  0% { transform: translate(-50%, -50%) scale(.45); opacity: 0; }
  24% { opacity: .9; }
  100% { transform: translate(-50%, -50%) scale(7); opacity: 0; }
}

@keyframes streaksDive {
  0% { transform: scale(.88) rotate(0deg); opacity: 0; }
  20% { opacity: .82; }
  100% { transform: scale(1.55) rotate(16deg); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .portal-jump-bg,
  .portal-jump-core,
  .portal-jump-ring,
  .portal-jump-streaks {
    animation: none !important;
  }
}
</style>


