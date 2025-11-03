<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const email = ref('')
const password = ref('')
const { signIn, signUp, signOut } = useAuth()
const msg = ref<string | null>(null)
const err = ref<string | null>(null)

async function handleSignIn() {
  msg.value = null
  err.value = null
  try {
    await signIn(email.value, password.value)
    msg.value = 'Signed in'
  } catch (e: any) {
    err.value = e?.message || 'Auth error'
  }
}

async function handleSignUp() {
  msg.value = null
  err.value = null
  try {
    await signUp(email.value, password.value)
    msg.value = 'Account created. Check your email to verify.'
  } catch (e: any) {
    err.value = e?.message || 'Sign up error'
  }
}

async function handleSignOut() {
  await signOut()
  msg.value = 'Signed out'
}
</script>

<template>
  <section class="section py-16 min-h-[60vh]">
    <div class="max-w-md mx-auto  mt-4">
      <div class="glass-card glass-panel p-6 md:p-8">
        <h1 class="text-2xl font-extrabold mb-4">Sign in</h1>

        <div class="space-y-4">
          <div>
            <label class="block text-sm mb-1">Email</label>
            <input
              v-model.trim="email"
              type="email"
              class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label class="block text-sm mb-1">Password</label>
            <input
              v-model.trim="password"
              type="password"
              class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
              placeholder="••••••••"
            />
          </div>

          <div class="flex flex-wrap gap-3 pt-2">
            <button type="button" class="glass-btn comet" @click="handleSignIn">Sign in</button>

          </div>

          <p class="text-white/80" v-if="msg">{{ msg }}</p>
          <p class="text-red-400" v-if="err">{{ err }}</p>
        </div>
      </div>
    </div>
  </section>
  
</template>

