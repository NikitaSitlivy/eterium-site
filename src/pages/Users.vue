<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { supabase } from "../lib/superbase"
import UiSpinner from "../components/UiSpinner.vue"

const router = useRouter()

type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string | null
}

const q = ref("")
const query = ref("")
const page = ref(1)
const pageSize = 20

const pending = ref(false)
const err = ref<string | null>(null)

const items = ref<Profile[]>([])
const total = ref(0)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize))
)
const from = computed(() => (page.value - 1) * pageSize)
const to = computed(() => from.value + pageSize - 1)

// мой id
const myId = ref<string | null>(null)
// состояния дружбы по userId
// 'self' | 'none' | 'pending_out' | 'pending_in' | 'friends'
const relations = ref<Record<string, string>>({})

// переход в чат
function goChat(userId: string) {
  router.push({ path: "/messages", query: { to: userId } })
}

function resetAndSearch() {
  page.value = 1
  query.value = q.value.trim().toLowerCase()
}

// debounce
let t: number | undefined
watch(q, () => {
  clearTimeout(t)
  t = window.setTimeout(resetAndSearch, 350)
})

// когда меняются query/page — грузим данные
watch([query, page], () => {
  load()
})

async function load() {
  pending.value = true
  err.value = null
  try {
    // 1) считаем total
    {
      let req = supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
      if (query.value) req = req.ilike("username", `%${query.value}%`)
      const { count, error } = await req
      if (error) throw error
      total.value = count || 0
    }

    // 2) получаем страницу
    {
      let req = supabase
        .from("profiles")
        .select("id, username, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .range(from.value, to.value)

      if (query.value) req = req.ilike("username", `%${query.value}%`)

      const { data, error } = await req
      if (error) throw error
      items.value = (data ?? []) as Profile[]
    }

    // 3) подгружаем состояния дружбы
    await loadRelationsForCurrentPage()
  } catch (e: any) {
    err.value = e?.message ?? "Failed to load users"
  } finally {
    pending.value = false
  }
}

async function loadRelationsForCurrentPage() {
  relations.value = {}
  if (!myId.value || items.value.length === 0) return

  const ids = items.value.map((u) => u.id).filter((id) => id !== myId.value)

  const { data, error } = await supabase
    .from("friendships")
    .select("id, requester, addressee, status")
    .or(`requester.eq.${myId.value},addressee.eq.${myId.value}`)
    .in("requester", [myId.value, ...ids])
    .in("addressee", [myId.value, ...ids])

  if (error || !data) return

  const map: Record<string, string> = {}
  for (const row of data) {
    const otherId =
      row.requester === myId.value ? row.addressee : row.requester
    if (row.status === "accepted") {
      map[otherId] = "friends"
    } else if (row.status === "pending") {
      if (row.requester === myId.value) map[otherId] = "pending_out"
      else map[otherId] = "pending_in"
    }
  }
  map[myId.value] = "self"
  relations.value = map
}

async function sendFriendRequest(userId: string) {
  if (!myId.value) return
  // оптимистично
  relations.value = { ...relations.value, [userId]: "pending_out" }
  const { error } = await supabase.from("friendships").insert({
    requester: myId.value,
    addressee: userId,
    status: "pending",
  })
  if (error) {
    relations.value = { ...relations.value, [userId]: "none" }
  }
}

async function acceptFriendRequest(userId: string) {
  if (!myId.value) return
  relations.value = { ...relations.value, [userId]: "friends" }
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("requester", userId)
    .eq("addressee", myId.value)
  if (error) {
    relations.value = { ...relations.value, [userId]: "pending_in" }
  }
}

async function cancelFriendRequest(userId: string) {
  if (!myId.value) return
  relations.value = { ...relations.value, [userId]: "none" }
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("requester", myId.value)
    .eq("addressee", userId)
  if (error) {
    relations.value = { ...relations.value, [userId]: "pending_out" }
  }
}

function goPrev() {
  if (page.value > 1) page.value--
}
function goNext() {
  if (page.value < totalPages.value) page.value++
}

// UI helpers
function avatarLetter(name: string | null, id: string) {
  const base = name || id || "U"
  return (base[0] || "U").toUpperCase()
}
const copied = ref<string | null>(null)
async function copyId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    copied.value = id
    setTimeout(() => (copied.value = null), 1200)
  } catch {}
}

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  myId.value = data.user?.id ?? null
  await load()
})
</script>

<template>
  <main class="p-6 section mx-auto mt-10">
    <UiSpinner :overlay="true" :open="pending" label="Loading users…" />

    <div class="head">
      <h1 class="text-2xl font-extrabold">Users</h1>
      <div class="tools">
        <div class="search glass-base">
          <svg class="ico" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            v-model="q"
            type="search"
            placeholder="Search by username…"
            class="search-input"
          />
        </div>
        <div class="meta">
          <span class="count" v-if="!err">
            {{ total }} result{{ total === 1 ? "" : "s" }}
          </span>
        </div>
      </div>
    </div>

    <p v-if="err" class="err mt-3">{{ err }}</p>

    <!-- Empty state -->
    <div
      v-if="!err && total === 0 && !pending"
      class="empty glass-card glass-panel"
    >
      <div class="empty-icon">👤</div>
      <div class="empty-title">No users found</div>
      <div class="empty-sub">
        Try a different query or clear the search field.
      </div>
    </div>

    <!-- Grid -->
    <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3 mt-4">
      <article
        v-for="u in items"
        :key="u.id"
        class="user-card glass-card glass-panel"
      >
        <div class="row">
          <img v-if="u.avatar_url" :src="u.avatar_url" alt="" class="avatar" />
          <div v-else class="avatar placeholder">
            {{ avatarLetter(u.username, u.id) }}
          </div>

          <div class="info">
            <div class="name">
              <template v-if="u.username">
                <RouterLink
                  :to="`/u/${encodeURIComponent(u.username)}`"
                  class="link"
                >
                  {{ u.username }}
                </RouterLink>
              </template>
              <template v-else>—</template>
            </div>
            <div class="sub">
              <span class="mono">{{ u.id.slice(0, 8) }}…</span>
              <button
                class="copy-btn"
                @click="copyId(u.id)"
                :title="`Copy ${u.id}`"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 8h12v12H8z"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                  <path
                    d="M4 4h12v12H4z"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                </svg>
              </button>
              <span v-if="copied === u.id" class="copied">copied</span>
            </div>
          </div>

          <!-- actions справа -->
          <div class="actions">
            <!-- друзья -->
            <button
              v-if="(relations[u.id] === 'none' || !relations[u.id]) && u.id !== myId"
              class="btn small"
              @click="sendFriendRequest(u.id)"
            >
              Add
            </button>
            <button
              v-else-if="relations[u.id] === 'pending_out'"
              class="btn small"
              @click="cancelFriendRequest(u.id)"
            >
              Sent
            </button>
            <button
              v-else-if="relations[u.id] === 'pending_in'"
              class="btn small"
              @click="acceptFriendRequest(u.id)"
            >
              Accept
            </button>
            <span v-else-if="relations[u.id] === 'friends'" class="badge">
              Friends
            </span>
          </div>
        </div>

        <div class="foot">
          <div class="created" v-if="u.created_at">
            Joined {{ new Date(u.created_at).toLocaleDateString() }}
          </div>
          <div class="created" v-else>
            Joined —
          </div>

          <div class="flex gap-2">
            <RouterLink
              v-if="u.username"
              :to="`/u/${encodeURIComponent(u.username)}`"
              class="btn"
              title="Open profile"
            >
              View
            </RouterLink>
            <button
              v-else
              class="btn"
              disabled
              title="No public profile"
            >
              View
            </button>

            <!-- Message -->
            <button
              v-if="u.id !== myId"
              class="btn"
              type="button"
              @click="goChat(u.id)"
            >
              Message
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pager">
      <button class="nav-cta" :disabled="page === 1" @click="goPrev">
        Prev
      </button>
      <div class="pages">
        Page <b>{{ page }}</b> / {{ totalPages }}
      </div>
      <button class="nav-cta" :disabled="page === totalPages" @click="goNext">
        Next
      </button>
    </div>
  </main>
</template>

<style scoped>
.title {
  font-size: 22px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.tools {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.search {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 6px 10px;
  min-width: 260px;
  background: rgba(255, 255, 255, 0.04);
}
.search .ico {
  width: 18px;
  height: 18px;
  opacity: 0.75;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.5;
  margin-right: 6px;
}
.search-input {
  background: transparent;
  outline: none;
  border: none;
  color: #fff;
  width: 100%;
  font-size: 14px;
}
.meta .count {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
}
.err {
  color: #ffb4b4;
}
.empty {
  margin-top: 28px;
  text-align: center;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  padding: 28px;
  background: rgba(255, 255, 255, 0.03);
}
.empty-icon {
  font-size: 28px;
}
.empty-title {
  margin-top: 6px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}
.empty-sub {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.7);
}
.user-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: radial-gradient(
      120% 120% at 10% -20%,
      rgba(160, 190, 255, 0.08),
      rgba(255, 255, 255, 0) 60%
    ),
    linear-gradient(180deg, rgba(18, 20, 26, 0.9), rgba(12, 14, 18, 0.9));
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 9999px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.avatar.placeholder {
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  font-weight: 700;
  font-size: 18px;
}
.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.name {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}
.sub {
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.75);
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.link {
  color: #cfe0ff;
  text-decoration: underline dotted;
}
.link:hover {
  color: #fff;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.copy-btn {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  transition: border-color 0.15s ease, background 0.15s ease,
    transform 0.1s ease;
}
.copy-btn:hover {
  border-color: rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}
.copied {
  color: #9dffbc;
  font-size: 12px;
}
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;
}
.created {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.03);
  padding: 0.35rem 0.7rem;
  font-size: 13px;
}
.btn.small {
  padding: 0.25rem 0.55rem;
  font-size: 12px;
}
.badge {
  background: rgba(133, 255, 183, 0.12);
  border: 1px solid rgba(133, 255, 183, 0.35);
  border-radius: 9999px;
  padding: 0.22rem 0.55rem;
  font-size: 12px;
  white-space: nowrap;
}
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}
.pages {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.82);
}
.nav-cta {
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.92);
  padding: 0.4rem 0.75rem;
  border-radius: 9999px;
  background: radial-gradient(
      100% 80% at 20% -20%,
      rgba(255, 255, 255, 0.1) 0,
      rgba(255, 255, 255, 0) 60%
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0.03)
    );
}
.nav-cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
