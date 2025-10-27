<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { supabase } from '../lib/superbase'
import UiSpinner from '../components/UiSpinner.vue'

type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string | null
}

const q = ref('')              // значение в инпуте поиска
const query = ref('')          // фактический запрос (после debounce)
const page = ref(1)
const pageSize = 20

const pending = ref(false)
const err = ref<string | null>(null)

const items = ref<Profile[]>([])
const total = ref(0)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const from = computed(() => (page.value - 1) * pageSize)
const to = computed(() => from.value + pageSize - 1)

function resetAndSearch() {
  page.value = 1
  query.value = q.value.trim().toLowerCase()
}

// debounce поиска
let t: number | undefined
watch(q, () => {
  clearTimeout(t)
  t = window.setTimeout(resetAndSearch, 350)
})

// когда меняются query/page — грузим данные
watch([query, page], () => { load() })

async function load() {
  pending.value = true
  err.value = null
  try {
    // 1) считаем total
    {
      let req = supabase.from('profiles').select('id', { count: 'exact', head: true })
      if (query.value) req = req.ilike('username', `%${query.value}%`)
      const { count, error } = await req
      if (error) throw error
      total.value = count || 0
    }

    // 2) получаем страницу
    {
      let req = supabase
        .from('profiles')
        .select('id, username, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .range(from.value, to.value)

      if (query.value) req = req.ilike('username', `%${query.value}%`)

      const { data, error } = await req
      if (error) throw error
      items.value = (data ?? []) as Profile[]
    }
  } catch (e: any) {
    err.value = e?.message ?? 'Failed to load users'
  } finally {
    pending.value = false
  }
}

function goPrev() { if (page.value > 1) page.value-- }
function goNext() { if (page.value < totalPages.value) page.value++ }

// UI helpers
function avatarLetter(name: string | null, id: string) {
  const base = name || id || 'U'
  return (base[0] || 'U').toUpperCase()
}
const copied = ref<string | null>(null)
async function copyId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    copied.value = id
    setTimeout(() => (copied.value = null), 1200)
  } catch {}
}

onMounted(load)
</script>

<template>
  <main class="p-6 section mx-auto mt-10">
    <UiSpinner :overlay="true" :open="pending" label="Loading users…" />

    <div class="head">
      <h1 class="text-2xl font-semibold">Users</h1>
      <div class="tools">
        <div class="search">
          <svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input
            v-model="q"
            type="search"
            placeholder="Search by username…"
            class="search-input"
          />
        </div>
        <div class="meta">
          <span class="count" v-if="!err">{{ total }} result{{ total===1 ? '' : 's' }}</span>
        </div>
      </div>
    </div>

    <p v-if="err" class="err mt-3">{{ err }}</p>

    <!-- Empty state -->
    <div v-if="!err && total === 0 && !pending" class="empty">
      <div class="empty-icon">👤</div>
      <div class="empty-title">No users found</div>
      <div class="empty-sub">
        Try a different query or clear the search field.
      </div>
    </div>

    <!-- Grid -->
    <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3 mt-4">
      <article v-for="u in items" :key="u.id" class="user-card glass-card glass-panel">
        <div class="row">
          <img v-if="u.avatar_url" :src="u.avatar_url" alt="" class="avatar" />
          <div v-else class="avatar placeholder">{{ avatarLetter(u.username, u.id) }}</div>

          <div class="info">
            <div class="name">
              <template v-if="u.username">
                <RouterLink :to="`/u/${encodeURIComponent(u.username)}`" class="link">
                  {{ u.username }}
                </RouterLink>
              </template>
              <template v-else>—</template>
            </div>
            <div class="sub">
              <span class="mono">{{ u.id.slice(0,8) }}…</span>
              <button class="copy-btn" @click="copyId(u.id)" :title="`Copy ${u.id}`">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M8 8h12v12H8z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M4 4h12v12H4z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </button>
              <span v-if="copied===u.id" class="copied">copied</span>
            </div>
          </div>
        </div>

        <div class="foot">
          <div class="created" v-if="u.created_at">
            Joined {{ new Date(u.created_at).toLocaleDateString() }}
          </div>
          <div class="created" v-else>
            Joined — 
          </div>

          <RouterLink
            v-if="u.username"
            :to="`/u/${encodeURIComponent(u.username)}`"
            class="btn"
            title="Open profile"
          >
            View
          </RouterLink>
          <button v-else class="btn btn--ghost" disabled title="No public profile">
            View
          </button>
        </div>
      </article>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pager">
      <button class="nav-cta" :disabled="page===1" @click="goPrev">Prev</button>
      <div class="pages">
        Page <b>{{ page }}</b> / {{ totalPages }}
      </div>
      <button class="nav-cta" :disabled="page===totalPages" @click="goNext">Next</button>
    </div>
  </main>
</template>

<style scoped>
.title{ font-size:22px; font-weight:700; color: rgba(255,255,255,.95); }
.head{ display:flex; align-items:center; justify-content:space-between; gap:1rem; }
.tools{ display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }

.search{
  position:relative; display:flex; align-items:center;
  border:1px solid rgba(255,255,255,.12);
  border-radius:12px; padding:6px 10px; min-width: 260px;
  background: rgba(255,255,255,.04);
}
.search .ico{ width:18px; height:18px; opacity:.75; stroke:currentColor; fill:none; stroke-width:1.5; margin-right:6px; }
.search-input{
  background: transparent; outline: none; border: none; color: #fff;
  width: 100%; font-size:14px;
}
.meta .count{ font-size:13px; color: rgba(255,255,255,.75); }

.err { color:#ffb4b4; }

/* Empty */
.empty{
  margin-top: 28px; text-align:center;
  border: 1px dashed rgba(255,255,255,.18);
  border-radius: 16px; padding: 28px;
  background: rgba(255,255,255,.03);
}
.empty-icon{ font-size: 28px; }
.empty-title{ margin-top: 6px; font-weight: 600; color: rgba(255,255,255,.95); }
.empty-sub{ margin-top: 2px; color: rgba(255,255,255,.7); }

/* Grid cards */
.user-card{
  border:1px solid rgba(255,255,255,.10);
  border-radius:16px;
  background:
    radial-gradient(120% 120% at 10% -20%, rgba(160,190,255,.08), rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(18,20,26,.9), rgba(12,14,18,.9));
  box-shadow: 0 12px 36px rgba(0,0,0,.45);
  padding: 14px;
  display:flex; flex-direction:column; gap:10px;
}
.row{ display:flex; gap:12px; }
.avatar{
  width:56px; height:56px; border-radius:9999px; object-fit:cover;
  border:1px solid rgba(255,255,255,.12);
}
.avatar.placeholder{
  display:grid; place-items:center;
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.95); font-weight:700; font-size:18px;
}
.info{ flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center; }
.name{ font-weight:600; color: rgba(255,255,255,.95); }
.sub{
  margin-top: 2px; display:flex; align-items:center; gap:6px;
  color: rgba(255,255,255,.75);
}

.link{ color:#cfe0ff; text-decoration: underline dotted; }
.link:hover{ color:#fff; }

.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.copy-btn{
  display:inline-grid; place-items:center;
  width:22px; height:22px; border:1px solid rgba(255,255,255,.18);
  border-radius:6px; background: rgba(255,255,255,.06);
  transition: border-color .15s ease, background .15s ease, transform .1s ease;
}
.copy-btn:hover{ border-color: rgba(255,255,255,.28); background: rgba(255,255,255,.1); transform: translateY(-1px); }
.copied{ color:#9dffbc; font-size:12px; }

/* foot */
.foot{
  display:flex; align-items:center; justify-content:space-between; gap:10px;
  margin-top: 6px;
}
.created{ font-size: 13px; color: rgba(255,255,255,.7); }

/* buttons */
.btn{
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.4rem .75rem; border-radius:9999px;
  border:1px solid rgba(255,255,255,.16);
  color:rgba(255,255,255,.92); font-size:13px;
  background:
    radial-gradient(100% 80% at 20% -20%, rgba(255,255,255,.10) 0, rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
  transition: border-color .18s ease, box-shadow .18s ease, transform .12s ease;
}
.btn:hover{ border-color: rgba(255,255,255,.24); box-shadow: 0 6px 18px rgba(0,0,0,.35); transform: translateY(-1px); }
.btn--ghost{ background: rgba(255,255,255,.03); opacity:.8; }

/* pager */
.pager{
  display:flex; align-items:center; justify-content:center; gap:10px;
  margin-top: 18px;
}
.pages{ font-size:14px; color: rgba(255,255,255,.82); }
.nav-cta{
  border:1px solid rgba(255,255,255,.16);
  color: rgba(255,255,255,.92);
  padding:.4rem .75rem; border-radius:9999px;
  background:
    radial-gradient(100% 80% at 20% -20%, rgba(255,255,255,.10) 0, rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
}
.nav-cta:disabled{ opacity:.5; cursor:not-allowed; }
</style>
