
<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../lib/superbase'
import UiSpinner from '../components/UiSpinner.vue'
import UiPopup from '../components/UiPopup.vue'

const router = useRouter()
const { user, isAuthed, signOut } = useAuth()

const profile = reactive<{ username: string; avatar_url: string | null }>({
  username: '',
  avatar_url: null,
})
const form = reactive<{ username: string; avatar_url: string | null }>({
  username: '',
  avatar_url: null,
})

const pending = ref(false)
const msg = ref<string | null>(null)
const err = ref<string | null>(null)

const showResetPopup = ref(false)

const email = computed(() => user.value?.email ?? '')
const emailVerified = computed(() =>
  Boolean((user.value as any)?.email_confirmed_at || (user.value as any)?.email_confirmed)
)

async function loadProfile() {
  if (!user.value?.id) return
  pending.value = true
  err.value = null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.value.id)
      .maybeSingle()
    if (error) throw error
    profile.username = data?.username ?? ''
    profile.avatar_url = data?.avatar_url ?? null
    form.username = profile.username
    form.avatar_url = profile.avatar_url
  } catch (e: any) {
    err.value = e?.message ?? 'Failed to load profile'
  } finally {
    pending.value = false
  }
}

async function saveProfile() {
  if (!user.value?.id) return
  err.value = null
  msg.value = null
  pending.value = true
  try {
    const uname = (form.username || '').trim().toLowerCase()
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname)) {
      err.value = 'Username: 3–20 letters, digits or _'
      return
    }
    const { data: existing, error: existsErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', uname)
      .maybeSingle()
    if (existsErr && existsErr.code !== 'PGRST116') throw existsErr
    if (existing?.id && existing.id !== user.value.id) {
      err.value = 'This username is already taken'
      return
    }

    const { error: upErr } = await supabase
      .from('profiles')
      .upsert({ id: user.value.id, username: uname, avatar_url: form.avatar_url ?? null })
    if (upErr) throw upErr

    profile.username = uname
    profile.avatar_url = form.avatar_url
    msg.value = 'Profile updated'
  } catch (e: any) {
    err.value = e?.message ?? 'Failed to update profile'
  } finally {
    pending.value = false
  }
}

async function onAvatarSelect(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0]
  if (!file || !user.value?.id) return
  err.value = null
  msg.value = null
  pending.value = true
  try {
    const ext = file.name.split('.').pop()
    const path = `${user.value.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })
    if (upErr) throw upErr
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    form.avatar_url = data.publicUrl
    msg.value = 'Avatar uploaded — don’t forget to Save'
  } catch (e: any) {
    err.value = e?.message ?? 'Failed to upload avatar (check bucket "avatars" and public access)'
  } finally {
    pending.value = false
  }
}

async function sendResetPassword() {
  if (!email.value) return
  err.value = null
  msg.value = null
  pending.value = true
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset`,
    } as any)
    if (error) throw error
    showResetPopup.value = true
  } catch (e: any) {
    err.value = e?.message ?? 'Failed to send reset email'
  } finally {
    pending.value = false
  }
}

async function doLogout() {
  pending.value = true
  try {
    await signOut()
    router.push('/')
  } finally {
    pending.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <main class="p-6 max-w-4xl mx-auto">
    <UiSpinner :overlay="true" :open="pending" label="Working…" />

    <h1 class="text-2xl font-bold">Account</h1>

    <div v-if="!isAuthed" class="mt-4 text-white/80">
      You are not signed in.
    </div>

    <section v-else class="mt-4 grid gap-6 md:grid-cols-[280px,1fr]">
      <div class="card p-4">
        <div class="flex flex-col items-center gap-4">
          <img
            v-if="form.avatar_url"
            :src="form.avatar_url"
            alt="avatar"
            class="w-28 h-28 rounded-full object-cover border border-white/10"
          />
          <div
            v-else
            class="w-28 h-28 rounded-full grid place-items-center border border-white/10 text-xl font-semibold bg-white/5"
          >
            {{ (profile.username || email.split('@')[0] || 'U').slice(0,1).toUpperCase() }}
          </div>

          <label class="nav-cta cursor-pointer">
            <input type="file" accept="image/*" class="hidden" @change="onAvatarSelect" />
            Upload avatar
          </label>

          <button class="nav-cta" @click="sendResetPassword">
            Reset password
          </button>

          <button class="nav-cta danger" @click="doLogout">Log out</button>
        </div>
      </div>

      <div class="card p-4 md:p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Profile</h2>
          <span
            v-if="email"
            class="text-xs px-2 py-1 rounded-full border"
            :class="emailVerified ? 'border-green-400/40 text-green-300' : 'border-amber-400/40 text-amber-300'"
          >
            {{ emailVerified ? 'Email verified' : 'Email not verified' }}
          </span>
        </div>

        <div class="mt-4 space-y-4">
          <div>
            <label class="block text-sm mb-1">Email</label>
            <input
              :value="email"
              disabled
              class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 opacity-80"
            />
          </div>

          <div>
            <label class="block text-sm mb-1">Username</label>
            <input
              v-model.trim="form.username"
              placeholder="your_nickname"
              class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent"
            />
            <p class="text-xs text-white/50 mt-1">3–20 letters, digits or underscore. Unique.</p>
          </div>
        </div>

        <div class="mt-6 flex items-center gap-3">
          <button class="cta" @click="saveProfile">Save changes</button>
          <button
            class="nav-cta"
            v-if="form.username !== profile.username || form.avatar_url !== profile.avatar_url"
            @click="form.username = profile.username; form.avatar_url = profile.avatar_url"
          >
            Cancel
          </button>
        </div>

        <p v-if="msg" class="text-green-300/90 text-sm mt-3">{{ msg }}</p>
        <p v-if="err" class="text-red-400 text-sm mt-3">{{ err }}</p>
      </div>
    </section>

    <UiPopup
      :open="showResetPopup"
      title="Password reset"
      :message="`We’ve sent a reset link to <b>${email}</b>. Please check your inbox.`"
      button-label="OK"
      @close="showResetPopup = false"
    />
  </main>
</template>

<style scoped>
.card{
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 16px;
  background:
    radial-gradient(120% 120% at 10% -20%, rgba(160,190,255,.08), rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(18,20,26,.9), rgba(12,14,18,.9));
  box-shadow: 0 12px 36px rgba(0,0,0,.45);
}
.nav-cta.danger{ color:#ffb4b4; border-color: rgba(255,80,80,.28); }
</style>
