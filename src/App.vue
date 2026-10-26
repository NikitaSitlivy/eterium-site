<template>
  <div>
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
          <div ref="authDialog" role="dialog" aria-modal="true" :aria-label="mode === 'signin' ? 'Sign in' : 'Create account'" class="card w-[92vw] max-w-md p-6 md:p-8 relative auth-card">
            <button aria-label="Close sign in dialog" class="absolute right-3 top-3 text-white/60 hover:text-white" @click="closeAuth">✕</button>
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
                  <label for="auth-username" class="block text-sm mb-1">Username</label>
                  <input
                    id="auth-username"
                    autocomplete="username"
                    v-model.trim="form.username"
                    type="text"
                    class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
                    placeholder="your_nickname"
                    :disabled="pending"
                  />
                  <p v-if="errors.username" class="text-red-400 text-xs mt-1">{{ errors.username }}</p>
                </div>

                <div>
                  <label for="auth-email" class="block text-sm mb-1">Email</label>
                  <input
                    id="auth-email"
                    autocomplete="email"
                    v-model.trim="form.email"
                    type="email"
                    class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
                    placeholder="you@example.com"
                    :disabled="pending"
                  />
                  <p v-if="errors.email" class="text-red-400 text-xs mt-1">{{ errors.email }}</p>
                </div>
                <div>
                  <label for="auth-password" class="block text-sm mb-1">Password</label>
                  <input
                    id="auth-password"
                    :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
                    v-model.trim="form.password"
                    :type="showPass ? 'text' : 'password'"
                    class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
                    placeholder="••••••••"
                    :disabled="pending"
                  />
                  <p v-if="errors.password" class="text-red-400 text-xs mt-1">{{ errors.password }}</p>
                </div>

                <div v-if="mode==='signup'">
                  <label for="auth-confirm" class="block text-sm mb-1">Confirm password</label>
                  <input
                    id="auth-confirm"
                    autocomplete="new-password"
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

                <div v-if="showGoogleAuth" class="pt-2">
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

    <Transition name="cookie-banner">
      <aside
        v-if="showCookieBanner"
        class="cookie-consent"
        role="dialog"
        aria-live="polite"
        aria-label="Cookie notice"
      >
        <div class="cookie-consent__copy">
          <strong>Cookies</strong>
          <span>
            We use essential cookies and local storage for sign-in, security, and saved preferences.
            Read our <RouterLink to="/privacy">Privacy Policy</RouterLink>.
          </span>
        </div>
        <div class="cookie-consent__actions">
          <button type="button" class="cookie-consent__button cookie-consent__button--ghost" @click="setCookieConsent('declined')">
            Decline
          </button>
          <button type="button" class="cookie-consent__button" @click="setCookieConsent('accepted')">
            Accept
          </button>
        </div>
      </aside>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from './components/site/AppHeader.vue'
import { useAuth } from './composables/useAuth'
import UiPopup from './components/UiPopup.vue'
import UiSpinner from './components/UiSpinner.vue'
import { getIpCountry } from './lib/geoCountry'
import './assets/styles/home.css'

const router = useRouter()
const route = useRoute()
let authStateSub: { unsubscribe: () => void } | null = null
const cookieConsentKey = 'eterium_cookie_consent'
const cookieConsent = ref<'accepted' | 'declined' | null>(null)
const showCookieBanner = computed(() => cookieConsent.value === null)

async function getSupabase() {
  const mod = await import('./lib/superbase')
  return mod.supabase
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeAuth()
  if (e.key !== 'Tab') return
  const elements = authDialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]')
  if (!elements?.length) return
  const first = elements[0]
  const last = elements[elements.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
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
  loadCookieConsent()
  if (route.path === '/reset') void bindAuthEvents()
})


onBeforeUnmount(() => {
  authStateSub?.unsubscribe()
  window.removeEventListener('keydown', onKey)
})

type Mode = 'signin' | 'signup'
const { isAuthed, signIn, signUp, signOut } = useAuth()

const authOpen = ref(false)
const authDialog = ref<HTMLElement | null>(null)
let authTrigger: HTMLElement | null = null
const mode = ref<Mode>('signin')
const showPass = ref(false)
const form = reactive({ email: '', password: '', confirm: '', username: '' })
const errors = reactive<{ email?: string; password?: string; confirm?: string; username?: string }>({})
const submitError = ref('')
const submitInfo = ref('')
const showVerifyPopup = ref(false)
const pending = ref(false)
const userCountry = ref<string | null>(null)
const countryResolved = ref(false)
const showGoogleAuth = computed(() => {
  if (countryResolved.value) return userCountry.value !== 'RU'
  return !isRussianUser()
})

async function resolveGoogleAuthAvailability() {
  userCountry.value = await getIpCountry()
  countryResolved.value = true
}

function isRussianUser() {
  const languages = [navigator.language, ...navigator.languages].filter(Boolean)
  const hasRussianLocale = languages.some((language) => /^ru(?:-|$)/i.test(language))
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const russianTimeZones = new Set([
    'Europe/Kaliningrad',
    'Europe/Moscow',
    'Europe/Simferopol',
    'Europe/Kirov',
    'Europe/Volgograd',
    'Europe/Astrakhan',
    'Europe/Saratov',
    'Europe/Ulyanovsk',
    'Europe/Samara',
    'Asia/Yekaterinburg',
    'Asia/Omsk',
    'Asia/Novosibirsk',
    'Asia/Barnaul',
    'Asia/Tomsk',
    'Asia/Novokuznetsk',
    'Asia/Krasnoyarsk',
    'Asia/Irkutsk',
    'Asia/Chita',
    'Asia/Yakutsk',
    'Asia/Khandyga',
    'Asia/Vladivostok',
    'Asia/Ust-Nera',
    'Asia/Magadan',
    'Asia/Sakhalin',
    'Asia/Srednekolymsk',
    'Asia/Kamchatka',
    'Asia/Anadyr'
  ])

  return hasRussianLocale || russianTimeZones.has(timeZone)
}

function loadCookieConsent() {
  try {
    const saved = window.localStorage.getItem(cookieConsentKey)
    if (saved === 'accepted' || saved === 'declined') {
      cookieConsent.value = saved
    }
  } catch {
    cookieConsent.value = null
  }
}

function setCookieConsent(nextConsent: 'accepted' | 'declined') {
  cookieConsent.value = nextConsent
  try {
    window.localStorage.setItem(cookieConsentKey, nextConsent)
  } catch {
    // Keep the banner dismissed for the current session if storage is blocked.
  }
}

watch(authOpen, async (open) => {
  if (open) {
    authTrigger = document.activeElement as HTMLElement | null
    window.addEventListener('keydown', onKey)
    await nextTick()
    authDialog.value?.querySelector<HTMLInputElement>('input')?.focus()
    return
  }
  window.removeEventListener('keydown', onKey)
  authTrigger?.focus()
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
  if (!countryResolved.value) void resolveGoogleAuthAvailability()
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
  if (provider === 'google' && !showGoogleAuth.value) return
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




