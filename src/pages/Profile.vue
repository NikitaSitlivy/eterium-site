<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../lib/superbase'
import UiSpinner from '../components/UiSpinner.vue'

const route = useRoute()
const { user } = useAuth()

const usernameParam = computed(() => (route.params.username as string | undefined) || undefined)
const isPublicView = computed(() => Boolean(usernameParam.value))

const pending = ref(false)
const err = ref<string | null>(null)
const msg = ref<string | null>(null)

type ProfileRow = {
  id: string
  username: string | null
  avatar_url: string | null
  created_at?: string | null
}
const profile = reactive<ProfileRow>({ id: '', username: null, avatar_url: null })

const email = computed(() => user.value?.email ?? '')
const displayName = computed(
  () => profile.username || (isPublicView.value ? 'User' : (email.value.split('@')[0] || 'User'))
)
const avatarInitial = computed(() => (displayName.value[0] || 'U').toUpperCase())

const joinedAt = computed<string | null>(() => {
  const fromProfile = (profile as any).created_at as string | null | undefined
  if (fromProfile) return new Date(fromProfile).toLocaleDateString()
  if (!isPublicView.value) {
    const v = (user.value as any)?.created_at
    if (v) return new Date(v).toLocaleDateString()
  }
  return null
})

const publicLink = computed(() =>
  profile.username ? `${window.location.origin}/u/${encodeURIComponent(profile.username)}` : ''
)

async function loadProfile() {
  pending.value = true
  err.value = null
  try {
    if (isPublicView.value) {
      const uname = usernameParam.value!.toLowerCase()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, created_at')
        .eq('username', uname)
        .maybeSingle()
      if (error) throw error
      if (!data) { err.value = 'User not found'; return }
      Object.assign(profile, data)
    } else {
      if (!user.value?.id) { err.value = 'Not signed in'; return }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, created_at')
        .eq('id', user.value.id)
        .maybeSingle()
      if (error) throw error
      if (!data) {
        Object.assign(profile, { id: user.value.id, username: null, avatar_url: null })
      } else {
        Object.assign(profile, data)
      }
    }
  } catch (e: any) {
    err.value = e?.message ?? 'Failed to load profile'
  } finally {
    pending.value = false
  }
}

const copiedId = ref(false)
const copiedLink = ref(false)
async function copyText(text: string, flagRef: typeof copiedId) {
  try {
    await navigator.clipboard.writeText(text)
    flagRef.value = true
    setTimeout(() => (flagRef.value = false), 1200)
  } catch {}
}
function copyId() { if (profile.id) copyText(profile.id, copiedId) }
function copyPublicLink() { if (publicLink.value) copyText(publicLink.value, copiedLink) }

watch(usernameParam, () => { loadProfile() })
onMounted(loadProfile)
</script>

<template>
  <main class="p-6 section mx-auto mt-10">
    <UiSpinner :overlay="true" :open="pending" label="Loading profile…" />

    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Profile</h1>

      <button
        v-if="profile.username"
        class="btn"
        @click="copyPublicLink"
        title="Copy public link"
      >
        <svg class="ico" viewBox="0 0 24 24"><path d="M8 8h10a2 2 0 012 2v10a2 2 0 01-2 2H10a2 2 0 01-2-2V8z"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/></svg>
        <span>{{ copiedLink ? 'Link copied' : 'Copy link' }}</span>
      </button>
    </div>

    <p v-if="err" class="err mt-3">{{ err }}</p>
    <p v-if="msg" class="ok mt-3">{{ msg }}</p>

    <section v-if="!err" class="mt-5 grid gap-6 md:grid-cols-[380px,1fr]">
      <!-- LEFT CARD -->
      <div class="card p-6 glass-card glass-panel">
        <div class="flex flex-col items-center">
          <img
            v-if="profile.avatar_url"
            :src="profile.avatar_url"
            alt="avatar"
            class="avatar"
          />
          <div v-else class="avatar placeholder">{{ avatarInitial }}</div>

          <div class="mt-4 text-center">
            <div class="title-lg">{{ displayName }}</div>
          </div>

          <dl class="meta mt-4">
            <div class="meta-row">
              <dt class="meta-k">ID</dt>
              <dd class="meta-v">
                <code class="mono">{{ profile.id || '—' }}</code>
                <button class="copy-btn" @click="copyId" :disabled="!profile.id" title="Copy ID">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M8 8h12v12H8z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M4 4h12v12H4z" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </button>
                <span v-if="copiedId" class="copied">copied</span>
              </dd>
            </div>

            <div class="meta-row">
              <dt class="meta-k">Joined</dt>
              <dd class="meta-v">
                <span v-if="joinedAt">{{ joinedAt }}</span>
                <span v-else class="soon">Soon</span>
              </dd>
            </div>

            <div class="meta-row" v-if="profile.username">
  <dt class="meta-k">Public</dt>
  <dd class="meta-v">
    <a :href="publicLink" class="link break" target="_blank" rel="noopener">
      {{ publicLink }}
    </a>
  </dd>
</div>

          </dl>
        </div>
      </div>

      <!-- RIGHT CARD -->
      <div class="card p-6 glass-card glass-panel">
        <h2 class="title-lg mb-4">About</h2>

        <dl class="meta">
          <div class="meta-row">
            <dt class="meta-k">Username</dt>
            <dd class="meta-v mono">{{ profile.username || '—' }}</dd>
          </div>
          <div class="meta-row">
            <dt class="meta-k">Bio</dt>
            <dd class="meta-v"><span class="soon">Soon</span></dd>
          </div>
          <div class="meta-row">
            <dt class="meta-k">Location</dt>
            <dd class="meta-v"><span class="soon">Soon</span></dd>
          </div>
        </dl>

        <div class="sep my-6"></div>

        <h2 class="title-lg mb-3">Highlights</h2>
        <div class="grid md:grid-cols-2 gap-3">
          <div class="mini-card">
            <div class="mini-title">Achievements</div>
            <div class="mini-body"><span class="soon">Soon</span></div>
          </div>
          <div class="mini-card">
            <div class="mini-title">Recent Matches</div>
            <div class="mini-body"><span class="soon">Soon</span></div>
          </div>
          <div class="mini-card">
            <div class="mini-title">Inventory</div>
            <div class="mini-body"><span class="soon">Soon</span></div>
          </div>
          <div class="mini-card">
            <div class="mini-title">Social</div>
            <div class="mini-body"><span class="soon">Soon</span></div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* === TYPOGRAPHY === */
.title-xl {
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
}
.title-lg {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}
.ok {
  color: #b9ffd2;
}
.err {
  color: #ffb4b4;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.link {
  color: #cfe0ff;
  text-decoration: underline dotted;
  transition: color 0.2s ease;
}
.link:hover {
  color: #ffffff;
}

/* === CARD BASE === */
.card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: radial-gradient(
      120% 120% at 10% -20%,
      rgba(160, 190, 255, 0.08),
      rgba(255, 255, 255, 0) 60%
    ),
    linear-gradient(180deg, rgba(18, 20, 26, 0.9), rgba(12, 14, 18, 0.9));
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
}

/* === AVATAR === */
.avatar {
  width: 112px;
  height: 112px;
  border-radius: 9999px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.avatar.placeholder {
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
}

/* === META LIST === */
.meta {
  width: 100%;

}
.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.meta-row:first-child {
  border-top: 0;
}
.meta-k {
  color: rgba(255, 255, 255, 0.7);
  min-width: 88px;
  font-size: 15px;
}
.meta-v {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.92);
  text-align: right;
}

/* перенос длинных ссылок */
.break {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}

/* альтернативный вариант (обрезка троеточием)
.break {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
*/

.copied {
  color: #9dffbc;
  font-size: 12px;
}

/* === BUTTONS === */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.44rem 0.8rem;
  border-radius: 9999px;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.92);
  background: radial-gradient(
      100% 80% at 20% -20%,
      rgba(255, 255, 255, 0.1) 0,
      rgba(255, 255, 255, 0) 60%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease;
}
.btn:hover {
  border-color: rgba(255, 255, 255, 0.24);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}
.ico {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* === COPY BUTTON === */
.copy-btn {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;
}
.copy-btn:hover {
  border-color: rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

/* === SEPARATORS / MINI CARDS === */
.sep {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}
.mini-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  background: rgba(255, 255, 255, 0.03);
}
.mini-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: rgba(255, 255, 255, 0.95);
}
.mini-body {
  color: rgba(255, 255, 255, 0.88);
}

/* === SOON BADGE === */
.soon {
  display: inline-block;
  padding: 0.08rem 0.45rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 0.78rem;
  color: #ffd7a3;
  background: rgba(255, 200, 120, 0.12);
}
</style>
