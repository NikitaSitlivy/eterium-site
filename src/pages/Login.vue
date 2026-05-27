<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

type Mode = 'signin' | 'signup'

const route = useRoute()
const router = useRouter()
const { signIn, signUp } = useAuth()

const mode = ref<Mode>(route.query.mode === 'signup' ? 'signup' : 'signin')
const form = reactive({
  email: '',
  password: '',
  confirm: ''
})
const err = ref<string | null>(null)
const pending = ref(false)

const heading = computed(() => mode.value === 'signup' ? 'Create account' : 'Sign in')

async function submit() {
  err.value = null
  pending.value = true
  try {
    if (mode.value === 'signup') {
      if (form.password.length < 8) throw new Error('Password must be at least 8 characters.')
      if (form.password !== form.confirm) throw new Error('Passwords do not match.')
      await signUp(form.email, form.password)
      await router.replace('/account')
      return
    }

    await signIn(form.email, form.password)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/account'
    await router.replace(redirect)
  } catch (error: any) {
    err.value = error?.message || 'Auth error'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="section py-16 min-h-[60vh]">
    <div class="max-w-md mx-auto mt-4">
      <div class="glass-card glass-panel p-6 md:p-8">
        <div class="flex gap-3 mb-5">
          <button
            type="button"
            class="glass-btn comet"
            :class="{ 'comet-active': mode === 'signin' }"
            @click="mode = 'signin'"
          >
            Sign in
          </button>
          <button
            type="button"
            class="glass-btn comet"
            :class="{ 'comet-active': mode === 'signup' }"
            @click="mode = 'signup'"
          >
            Sign up
          </button>
        </div>

        <h1 class="text-2xl font-extrabold mb-4">{{ heading }}</h1>

        <div class="space-y-4">
          <div>
            <label class="block text-sm mb-1">Email</label>
            <input
              v-model.trim="form.email"
              type="email"
              class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
              placeholder="you@example.com"
              autocomplete="email"
            />
          </div>

          <div>
            <label class="block text-sm mb-1">Password</label>
            <input
              v-model.trim="form.password"
              type="password"
              class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
              placeholder="Password"
              :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
            />
          </div>

          <div v-if="mode === 'signup'">
            <label class="block text-sm mb-1">Confirm password</label>
            <input
              v-model.trim="form.confirm"
              type="password"
              class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
              placeholder="Confirm password"
              autocomplete="new-password"
            />
          </div>

          <div class="flex flex-wrap gap-3 pt-2">
            <button type="button" class="glass-btn comet" :disabled="pending" @click="submit">
              {{ pending ? 'Working...' : heading }}
            </button>
          </div>

          <p v-if="err" class="text-red-400">{{ err }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
