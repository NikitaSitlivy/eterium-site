<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/superbase'

const router = useRouter()
const loading = ref(true)
const canReset = ref(false)

// форма смены пароля
const password = ref('')
const confirm = ref('')
const errorMsg = ref('')
const infoMsg = ref('')

// состояние ошибки ссылки
const linkError = ref<'otp_expired' | 'access_denied' | ''>('')

// форма повторной отправки письма
const resendEmail = ref('')
const resendPending = ref(false)
const resendInfo = ref('')
const resendError = ref('')

function validate(): boolean {
  errorMsg.value = ''
  if (!password.value || password.value.length < 8) {
    errorMsg.value = 'Password must be at least 8 characters'
    return false
  }
  if (password.value !== confirm.value) {
    errorMsg.value = 'Passwords do not match'
    return false
  }
  return true
}

async function submit() {
  if (!validate()) return
  errorMsg.value = ''
  try {
    const { error } = await supabase.auth.updateUser({ password: password.value })
    if (error) throw error
    infoMsg.value = 'Password updated. You can now sign in.'
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'Failed to update password'
  }
}

async function resend() {
  resendError.value = ''
  resendInfo.value = ''
  if (!resendEmail.value) {
    resendError.value = 'Enter your email'
    return
  }
  try {
    resendPending.value = true
    const { error } = await supabase.auth.resetPasswordForEmail(resendEmail.value, {
      redirectTo: `${window.location.origin}/reset`
    } as any)
    if (error) throw error
    resendInfo.value = 'We\'ve sent a new reset link to your email.'
  } catch (e: any) {
    resendError.value = e?.message ?? 'Failed to send reset email'
  } finally {
    resendPending.value = false
  }
}

onMounted(async () => {
  try {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    if (code) {
      try { await supabase.auth.exchangeCodeForSession(code) } catch {}
      router.replace({ path: '/reset' })
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const access_token = hashParams.get('access_token')
    const refresh_token = hashParams.get('refresh_token')
    const isRecovery = hashParams.get('type') === 'recovery'
    const err = hashParams.get('error')
    const errCode = hashParams.get('error_code')

    if (err && errCode) {
      // Например: error=access_denied&error_code=otp_expired
      if (errCode === 'otp_expired') linkError.value = 'otp_expired'
      else linkError.value = 'access_denied'
      // Почистим URL, чтобы не мешал обновлению страницы
      router.replace({ path: '/reset' })
    }

    if (access_token && refresh_token && isRecovery) {
      try {
        await supabase.auth.setSession({ access_token, refresh_token })
        router.replace({ path: '/reset' })
      } catch {}
    }
  } catch {}

  try {
    const { data } = await supabase.auth.getUser()
    canReset.value = !!data.user
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="section mx-auto p-6 max-w-md mt-10">
    <h1 class="text-2xl font-semibold mb-4">Reset password</h1>
    <p v-if="loading" class="opacity-70">Loading…</p>

    <div v-else>
      <!-- Блок ошибки просроченной/недействительной ссылки -->
      <div v-if="linkError" class="space-y-4">
        <p class="opacity-80">
          This reset link is invalid or has expired.
        </p>
        <div class="space-y-2">
          <label class="block text-sm">Enter your email to get a new link</label>
          <input
            v-model.trim="resendEmail"
            type="email"
            class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
            placeholder="you@example.com"
          />
          <div class="flex items-center gap-2">
            <button class="cta" @click="resend" :disabled="resendPending">Send new link</button>
            <span v-if="resendPending" class="text-sm opacity-70">Sending…</span>
          </div>
          <p v-if="resendError" class="text-red-400 text-sm">{{ resendError }}</p>
          <p v-if="resendInfo" class="text-green-400 text-sm">{{ resendInfo }}</p>
        </div>
      </div>

      <!-- Инструкция по открытию, если ещё не авторизованы ссылкой -->
      <div v-else-if="!canReset" class="space-y-3">
        <p class="opacity-80">
          Open this page from the password reset link sent to your email.
        </p>
        <p class="opacity-60 text-sm">
          If you haven’t requested a reset yet, use “Forgot password?” on the sign-in form.
        </p>
      </div>

      <!-- Форма смены пароля -->
      <form v-else class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm mb-1">New password</label>
          <input
            v-model.trim="password"
            type="password"
            class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
            placeholder="Enter new password"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">Confirm password</label>
          <input
            v-model.trim="confirm"
            type="password"
            class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
            placeholder="Repeat new password"
          />
        </div>
        <button type="submit" class="cta">Update password</button>
        <p v-if="errorMsg" class="text-red-400 text-sm">{{ errorMsg }}</p>
        <p v-if="infoMsg" class="text-green-400 text-sm">{{ infoMsg }}</p>
      </form>
    </div>
  </main>
</template>

