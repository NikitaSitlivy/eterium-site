<!-- pages/Settings.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '../lib/superbase'
import UiPopup from '../components/UiPopup.vue'
import UiSpinner from '../components/UiSpinner.vue'

const loading = ref(false)
const msg = ref<string | null>(null)
const err = ref<string | null>(null)
const email = ref<string>('')

const prefs = reactive({
  systemNotifs: true,
  emailNotifs: false
})

// popup state
const confirmDelete = ref(false)
const deleting = ref(false)

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  email.value = data.user?.email ?? ''
  // Заглушка: позже prefs можно грузить из user_metadata
  const user = data.user
  prefs.systemNotifs = !!user?.user_metadata?.system_notifs ?? true
  prefs.emailNotifs = !!user?.user_metadata?.email_notifs ?? false
})

async function resendVerification() {
  try {
    loading.value = true
    msg.value = null
    err.value = null
    const { error } = await (supabase.auth as any).resend({
      type: 'signup',
      email: email.value
    })
    if (error) throw error
    msg.value = 'Verification email sent again.'
  } catch (e: any) {
    err.value = e?.message || 'Failed to resend verification'
  } finally {
    loading.value = false
  }
}

async function updatePrefs() {
  try {
    loading.value = true
    msg.value = null
    err.value = null
    const user = await supabase.auth.getUser()
    const { error } = await supabase.auth.updateUser({
      data: {
        system_notifs: prefs.systemNotifs,
        email_notifs: prefs.emailNotifs
      }
    })
    if (error) throw error
    msg.value = 'Preferences updated.'
  } catch (e: any) {
    err.value = e?.message || 'Failed to update preferences'
  } finally {
    loading.value = false
  }
}

async function changePassword() {
  try {
    loading.value = true
    msg.value = null
    err.value = null
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset`
    } as any)
    if (error) throw error
    msg.value = 'Password reset email sent.'
  } catch (e: any) {
    err.value = e?.message || 'Failed to send reset link'
  } finally {
    loading.value = false
  }
}

async function deleteAccount() {
  try {
    deleting.value = true
    msg.value = null
    err.value = null
    const { data } = await supabase.auth.getUser()
    const uid = data.user?.id
    if (!uid) throw new Error('Not signed in')
    // Удаляем профиль и пользователя
    await supabase.from('profiles').delete().eq('id', uid)
    await supabase.auth.signOut()
    msg.value = 'Account deleted.'
    window.location.assign('/')
  } catch (e: any) {
    err.value = e?.message || 'Failed to delete account'
  } finally {
    deleting.value = false
    confirmDelete.value = false
  }
}
</script>

<template>
  <main class="p-6 section mx-auto mt-10">
    <UiSpinner :overlay="true" :open="loading || deleting" label="Working…" />
    <h1 class="text-2xl font-extrabold mb-4">Settings</h1>

    <div class="grid gap-4 md:grid-cols-2">
      <!-- Account -->
      <section class="glass-card glass-panel p-6 flex flex-col gap-3">
        <h2 class="font-semibold mb-1">Account</h2>
        <div class="text-sm text-white/80">Email: <b>{{ email || '—' }}</b></div>

        <div class="flex flex-col gap-2 mt-2">
          <!-- <button class="glass-btn comet" @click="resendVerification" :disabled="loading">
            Resend verification
          </button> -->
          <button class="glass-btn comet" @click="changePassword" :disabled="loading">
            Change password
          </button>
        </div>
      </section>

      <!-- Preferences -->
      <section class="glass-card glass-panel p-6 flex flex-col gap-4">
        <h2 class="font-semibold">Preferences</h2>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="prefs.systemNotifs" class="accent-eter-accent" />
          Enable system notifications
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="prefs.emailNotifs" class="accent-eter-accent" />
          Email notifications
        </label>
        <button class="glass-btn comet mt-2" @click="updatePrefs" :disabled="loading">
          Save preferences
        </button>
      </section>

      <!-- Danger zone -->
      <section class="glass-card glass-panel p-6 md:col-span-2">
        <h2 class="font-semibold mb-3 text-red-300">Danger zone</h2>
        <p class="text-sm text-white/70">
          Deleting your account is irreversible. All your data, friends and progress will be lost.
        </p>
        <button class="glass-btn comet mt-3 danger" @click="confirmDelete = true">
          Delete account
        </button>
      </section>
    </div>

    <p v-if="msg" class="text-green-300/90 text-sm mt-4">{{ msg }}</p>
    <p v-if="err" class="text-red-400 text-sm mt-4">{{ err }}</p>

    <UiPopup
      :open="confirmDelete"
      title="Confirm deletion"
      message="Are you sure you want to permanently delete your account?"
      button-label="Delete"
      variant="danger"
      @close="confirmDelete = false"
      @confirm="deleteAccount"
    />
  </main>
</template>

<style scoped>
.danger {
  border-color: rgba(255, 80, 80, 0.35);
  background: radial-gradient(
      100% 80% at 20% -20%,
      rgba(255, 80, 80, 0.14) 0,
      rgba(255, 80, 80, 0) 60%
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0.03)
    );
  color: #ffb4b4;
  box-shadow: 0 4px 14px rgba(255, 80, 80, 0.18);
}
</style>
