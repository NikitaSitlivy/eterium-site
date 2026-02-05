<!-- pages/Profile.vue -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { supabase } from "../lib/superbase";
import UiSpinner from "../components/UiSpinner.vue";

/* ----------------------- route/auth ----------------------- */
const route = useRoute();
const { user } = useAuth();

const usernameParam = computed(
  () => (route.params.username as string | undefined) || undefined
);
const isPublicView = computed(() => Boolean(usernameParam.value));

/* ----------------------- state ----------------------- */
const pending = ref(false);
const err = ref<string | null>(null);
const msg = ref<string | null>(null);

/* ----------------------- profile ----------------------- */
type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at?: string | null;
};
const profile = reactive<ProfileRow>({
  id: "",
  username: null,
  avatar_url: null,
  bio: null,
});

const editMode = ref(false);
const formUsername = ref<string>("");
const formBio = ref<string>("");

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const usernameError = computed<string | null>(() => {
  const v = formUsername.value.trim();
  if (!v) return null;
  if (!USERNAME_RE.test(v)) return "Only a–z, 0–9, underscore; 3–20 chars";
  return null;
});

const email = computed(() => user.value?.email ?? "");
const displayName = computed(
  () =>
    profile.username ||
    (isPublicView.value ? "User" : email.value.split("@")[0] || "User")
);
const avatarInitial = computed(() =>
  (displayName.value[0] || "U").toUpperCase()
);

const joinedAt = computed<string | null>(() => {
  const fromProfile = profile.created_at;
  if (fromProfile) return new Date(fromProfile).toLocaleDateString();
  if (!isPublicView.value) {
    const v = (user.value as any)?.created_at;
    if (v) return new Date(v).toLocaleDateString();
  }
  return null;
});

const publicLink = computed(() => {
  if (!profile.username) return "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return origin
    ? `${origin}/u/${encodeURIComponent(profile.username)}`
    : `/u/${encodeURIComponent(profile.username)}`;
});

/* ----------------------- lists: achievements ----------------------- */
type AchRow = {
  id: string;
  title: string;
  icon_url: string | null;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | string;
  earned_at: string;
};
const achLoading = ref(false);
const achRows = ref<AchRow[]>([]);
const ACH_PAGE_SIZE = 8;
const achPage = ref(0);
const achEnd = ref(false);

/* ----------------------- lists: inventory ----------------------- */
type InvRow = {
  item_id: string;
  name: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  icon_url: string | null;
  acquired_at: string;
};
const invLoading = ref(false);
const invRows = ref<InvRow[]>([]);
const INV_PAGE_SIZE = 8;
const invPage = ref(0);
const invEnd = ref(false);

const invItems = computed(() =>
  invRows.value.map((r) => ({
    key: `${r.item_id}-${r.acquired_at}`,
    id: r.item_id,
    name: r.name,
    rarity: r.rarity,
    icon_url: r.icon_url,
    acquired_at: r.acquired_at,
  }))
);

/* ----------------------- helpers ----------------------- */
function rarityClass(r: string) {
  if (r === "legendary") return "badge-legendary";
  if (r === "epic") return "badge-epic";
  if (r === "rare") return "badge-rare";
  if (r === "uncommon") return "badge-uncommon";
  return "badge-common";
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dd}.${m}.${y}`;
}

function resetLists() {
  achRows.value = [];
  invRows.value = [];
  achPage.value = 0;
  invPage.value = 0;
  achEnd.value = false;
  invEnd.value = false;
}

/* ----------------------- data fetching ----------------------- */
async function loadAchievementsByUser(
  userId: string,
  page = 0,
  append = false
) {
  achLoading.value = true;
  try {
    const from = page * ACH_PAGE_SIZE;
    const to = from + ACH_PAGE_SIZE - 1;

    // Публичная вьюха достижений
    const { data, error } = await supabase
      .from("achievements_public")
      .select("id, title, icon_url, rarity, earned_at, user_id")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const rows = (data ?? []) as AchRow[];
    achRows.value = append ? [...achRows.value, ...rows] : rows;

    achPage.value = page;
    if (rows.length < ACH_PAGE_SIZE) achEnd.value = true;
  } finally {
    achLoading.value = false;
  }
}

async function loadInventoryByUser(userId: string, page = 0, append = false) {
  invLoading.value = true;
  try {
    const from = page * INV_PAGE_SIZE;
    const to = from + INV_PAGE_SIZE - 1;

    // Публичная вьюха инвентаря (раскрытая)
    const { data, error } = await supabase
      .from("inventory_public")
      .select("acquired_at, item_id, name, rarity, icon_url, user_id")
      .eq("user_id", userId)
      .order("acquired_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const rows = (data ?? []) as InvRow[];
    invRows.value = append ? [...invRows.value, ...rows] : rows;

    invPage.value = page;
    if (rows.length < INV_PAGE_SIZE) invEnd.value = true;
  } finally {
    invLoading.value = false;
  }
}

function loadMoreAchievements() {
  if (achLoading.value || achEnd.value || !profile.id) return;
  loadAchievementsByUser(profile.id, achPage.value + 1, true);
}
function loadMoreInventory() {
  if (invLoading.value || invEnd.value || !profile.id) return;
  loadInventoryByUser(profile.id, invPage.value + 1, true);
}

/* ----------------------- copy helpers ----------------------- */
const copiedId = ref(false);
const copiedLink = ref(false);
async function copyText(text: string, flagRef: typeof copiedId) {
  try {
    await navigator.clipboard.writeText(text);
    flagRef.value = true;
    setTimeout(() => (flagRef.value = false), 1200);
  } catch {}
}
function copyId() {
  if (profile.id) copyText(profile.id, copiedId);
}
function copyPublicLink() {
  if (publicLink.value) copyText(publicLink.value, copiedLink);
}

/* ----------------------- save profile ----------------------- */
async function isUsernameTaken(uname: string, excludeId?: string) {
  const u = uname.toLowerCase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", u);
  if (error) throw error;
  if (!data) return false;
  return data.some((r) => r.id !== excludeId);
}

const saving = ref(false);
async function saveProfile() {
  if (isPublicView.value) return;
  if (!user.value?.id) {
    err.value = "Not signed in";
    return;
  }
  err.value = null;
  msg.value = null;

  const unameRaw = formUsername.value.trim();
  const uname = unameRaw ? unameRaw.toLowerCase() : null;

  if (uname && usernameError.value) {
    err.value = usernameError.value;
    return;
  }
  try {
    saving.value = true;
    if (uname) {
      const taken = await isUsernameTaken(uname, user.value.id);
      if (taken) {
        err.value = "This username is already taken";
        return;
      }
    }
    const payload: Partial<ProfileRow> = {
      username: uname,
      bio: formBio.value.trim() || null,
    };
    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.value.id);
    if (error) throw error;
    await loadProfile(); // перезагрузим
    editMode.value = false;
    msg.value = "Profile saved";
  } catch (e: any) {
    err.value = e?.message ?? "Failed to save profile";
  } finally {
    saving.value = false;
  }
}

function cancelEdit() {
  formUsername.value = profile.username || "";
  formBio.value = profile.bio || "";
  editMode.value = false;
}

/* ----------------------- profile load ----------------------- */
async function loadProfile() {
  pending.value = true;
  err.value = null;
  try {
    if (isPublicView.value) {
      const uname = usernameParam.value!.toLowerCase();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, created_at")
        .eq("username", uname)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        err.value = "User not found";
        return;
      }
      Object.assign(profile, data);
      formUsername.value = profile.username || "";
      formBio.value = profile.bio || "";
    } else {
      if (!user.value?.id) {
        err.value = "Not signed in";
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, created_at")
        .eq("id", user.value.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        Object.assign(profile, {
          id: user.value.id,
          username: null,
          avatar_url: null,
          bio: null,
        });
      } else {
        Object.assign(profile, data);
        formUsername.value = profile.username || "";
        formBio.value = profile.bio || "";
      }
    }
  } catch (e: any) {
    err.value = e?.message ?? "Failed to load profile";
  } finally {
    pending.value = false;
  }

  // Грузим публичные секции (всегда видны)
  if (profile.id) {
    resetLists();
    await Promise.all([
      loadAchievementsByUser(profile.id, 0, false),
      loadInventoryByUser(profile.id, 0, false),
    ]);
  }
}

/* ----------------------- effects ----------------------- */
watch(usernameParam, loadProfile);
onMounted(loadProfile);
</script>

<template>
  <main class="p-6 section mx-auto mt-10">
    <UiSpinner :overlay="true" :open="pending" label="Loading profile…" />

    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Profile</h1>

      <div class="flex items-center gap-2">
        <button
          v-if="!isPublicView"
          class="btn"
          @click="editMode = !editMode"
          :title="editMode ? 'Close editor' : 'Edit profile'"
        >
          <svg class="ico" viewBox="0 0 24 24">
            <path d="M12 20h9" />
            <path
              d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
            />
          </svg>
          <span>{{ editMode ? "Close" : "Edit" }}</span>
        </button>

        <button
          v-if="profile.username"
          class="btn"
          @click="copyPublicLink"
          title="Copy public link"
        >
          <svg class="ico" viewBox="0 0 24 24">
            <path
              d="M8 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8Z"
            />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
          </svg>
          <span>{{ copiedLink ? "Link copied" : "Copy link" }}</span>
        </button>
      </div>
    </div>

    <p v-if="err" class="err mt-3">{{ err }}</p>
    <p v-if="msg" class="ok mt-3">{{ msg }}</p>

    <section v-if="!err" class="mt-5 grid gap-6 md:grid-cols-[380px,1fr]">
      <!-- LEFT -->
      <div class="card p-6 glass-card glass-panel card-max-h">
        <div class="flex flex-col items-center">
          <img
            v-if="profile.avatar_url"
            :src="profile.avatar_url"
            alt="avatar"
            class="avatar"
              referrerpolicy="no-referrer"
          />
          <div v-else class="avatar placeholder">{{ avatarInitial }}</div>

          <div class="mt-4 text-center">
            <div class="title-lg">{{ displayName }}</div>
          </div>

          <dl class="meta mt-4">
            <div class="meta-row">
              <dt class="meta-k">ID</dt>
              <dd class="meta-v">
                <code class="mono">{{ profile.id || "—" }}</code>
                <button
                  class="copy-btn"
                  @click="copyId"
                  :disabled="!profile.id"
                  title="Copy ID"
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
                <a
                  :href="publicLink"
                  class="link break"
                  target="_blank"
                  rel="noopener"
                >
                  {{ publicLink }}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="card p-6 glass-card glass-panel">
        <h2 class="title-lg mb-4">About</h2>

        <dl class="meta" v-if="!editMode">
          <div class="meta-row">
            <dt class="meta-k">Username</dt>
            <dd class="meta-v mono">
              <template v-if="profile.username">{{ profile.username }}</template>
              <template v-else>
                <button v-if="!isPublicView" class="btn" @click="editMode = true"
                  >Set username</button
                >
                <span v-else>—</span>
              </template>
            </dd>
          </div>
          <div class="meta-row">
            <dt class="meta-k">Bio</dt>
            <dd class="meta-v">
              <template v-if="profile.bio && profile.bio.length">{{
                profile.bio
              }}</template>
              <span v-else class="soon">—</span>
            </dd>
          </div>
          <div class="meta-row">
            <dt class="meta-k">Location</dt>
            <dd class="meta-v"><span class="soon">Soon</span></dd>
          </div>
        </dl>

        <div v-else class="grid gap-3">
          <label class="field">
            <span class="field-label">Username</span>
            <input
              class="input"
              placeholder="your_name"
              v-model.trim="formUsername"
              :class="{ 'input-err': !!usernameError }"
              :disabled="saving"
            />
            <span v-if="usernameError" class="err mt-1">{{
              usernameError
            }}</span>
          </label>

          <label class="field">
            <span class="field-label">Bio</span>
            <textarea
              class="textarea"
              rows="4"
              placeholder="Tell something about you"
              v-model.trim="formBio"
              :disabled="saving"
            />
          </label>

          <div class="flex gap-2 justify-end mt-2">
            <button class="btn" @click="cancelEdit" :disabled="saving">
              Cancel
            </button>
            <button
              class="btn"
              @click="saveProfile"
              :disabled="saving || !!usernameError"
            >
              <svg class="ico" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{{ saving ? "Saving…" : "Save" }}</span>
            </button>
          </div>
        </div>

        <div class="sep my-6" />

        <!-- Highlights -->
        <h2 class="title-lg mb-3">Highlights</h2>

        <!-- Achievements (public) -->
        <div class="mini-card" style="grid-column: 1 / -1;">
          <div class="mini-title">Achievements</div>
          <div class="mini-body inv-body">
            <div v-if="achLoading && achRows.length === 0" class="inv-grid">
              <div v-for="n in 6" :key="n" class="inv-tile inv-skeleton"></div>
            </div>

            <div v-else-if="achRows.length === 0" class="text-white/60">
              No achievements yet
            </div>

            <div v-else class="inv-grid">
              <div v-for="a in achRows" :key="a.id" class="inv-tile">
                <div class="inv-imgwrap">
                  <img
                    v-if="a.icon_url"
                    :src="a.icon_url"
                    :alt="a.title"
                    class="inv-img"
                    loading="lazy"
                  />
                  <div v-else class="inv-placeholder">🏆</div>
                </div>
                <div class="inv-footer">
                  <div class="inv-name" :title="a.title">{{ a.title }}</div>
                  <span class="inv-badge" :class="rarityClass(a.rarity)">{{
                    a.rarity
                  }}</span>
                </div>
                <div class="inv-date">{{ fmtDate(a.earned_at) }}</div>
              </div>
            </div>

            <div v-if="!achLoading && achRows.length && !achEnd" class="mt-3">
              <button class="btn" @click="loadMoreAchievements">Load more</button>
            </div>
          </div>
        </div>

        <!-- Inventory (public) -->
        <div class="mini-card" style="grid-column: 1 / -1;">
          <div class="mini-title">Inventory</div>

          <div v-if="invLoading && invItems.length === 0" class="mini-body inv-body">
            <div class="inv-grid">
              <div v-for="n in 8" :key="n" class="inv-tile inv-skeleton"></div>
            </div>
          </div>

          <div v-else-if="invItems.length === 0" class="mini-body text-white/60">
            No items yet
          </div>

          <div v-else class="mini-body inv-body">
            <div class="inv-grid">
              <div v-for="it in invItems" :key="it.key" class="inv-tile">
                <div class="inv-imgwrap">
                  <img
                    :src="it.icon_url || ''"
                    :alt="it.name"
                    class="inv-img"
                    loading="lazy"
                  />
                </div>

                <div class="inv-footer">
                  <div class="inv-name" :title="it.name">{{ it.name }}</div>
                  <span class="inv-badge" :class="rarityClass(it.rarity)">{{
                    it.rarity
                  }}</span>
                </div>

                <div class="inv-date">{{ fmtDate(it.acquired_at) }}</div>
              </div>
            </div>

            <div v-if="!invLoading && invItems.length && !invEnd" class="mt-3">
              <button class="btn" @click="loadMoreInventory">Load more</button>
            </div>
          </div>
        </div>

        <!-- Social (placeholder) -->
        <div class="mini-card" style="grid-column: 1 / -1;">
          <div class="mini-title">Social</div>
          <div class="mini-body"><span class="soon">Soon</span></div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* == TYPOGRAPHY == */
.title-lg{ font-size:18px; font-weight:600; color:rgba(255,255,255,.95); }
.ok{ color:#b9ffd2; } .err{ color:#ffb4b4; }
.mono{ font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
.link{ color:#cfe0ff; text-decoration:underline dotted; transition:color .2s; }
.link:hover{ color:#fff; }

/* == CARD == */
.card{
  border:1px solid rgba(255,255,255,.10);
  border-radius:16px;
  background:
    radial-gradient(120% 120% at 10% -20%, rgba(160,190,255,.08), rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(18,20,26,.9), rgba(12,14,18,.9));
  box-shadow:0 12px 36px rgba(0,0,0,.45);
}

/* == AVATAR == */
.avatar{ width:112px; height:112px; border-radius:9999px; object-fit:cover; border:1px solid rgba(255,255,255,.12); }
.avatar.placeholder{ display:grid; place-items:center; font-size:28px; font-weight:700; color:rgba(255,255,255,.95); border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.05); }

/* == META == */
.meta{ width:100%; }
.meta-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 0; border-top:1px solid rgba(255,255,255,.08); }
.meta-row:first-child{ border-top:0; }
.meta-k{ color:rgba(255,255,255,.7); min-width:88px; font-size:15px; }
.meta-v{ flex:1; min-width:0; display:flex; align-items:center; justify-content:flex-end; gap:8px; font-size:15px; color:rgba(255,255,255,.92); text-align:right; }
.break{ max-width:100%; overflow-wrap:anywhere; word-break:break-word; }
.copied{ color:#9dffbc; font-size:12px; }

/* == BUTTONS == */
.btn{
  display:inline-flex; align-items:center; gap:.5rem; padding:.44rem .8rem; border-radius:9999px; font-size:14px;
  border:1px solid rgba(255,255,255,.16); color:rgba(255,255,255,.92);
  background: radial-gradient(100% 80% at 20% -20%, rgba(255,255,255,.10) 0, rgba(255,255,255,0) 60%), linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
  transition:border-color .18s, box-shadow .18s, transform .12s;
}
.btn:hover{ border-color:rgba(255,255,255,.24); box-shadow:0 6px 18px rgba(0,0,0,.35); transform:translateY(-1px); }
.ico{ width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
.copy-btn{ display:inline-grid; place-items:center; width:24px; height:24px; border:1px solid rgba(255,255,255,.18); border-radius:6px; background:rgba(255,255,255,.06); transition:border-color .15s, background .15s, transform .1s; }
.copy-btn:hover{ border-color:rgba(255,255,255,.28); background:rgba(255,255,255,.1); transform:translateY(-1px); }

/* other */
.sep{ height:1px; background:rgba(255,255,255,.08); }
.mini-card{ border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:.9rem 1rem; background:rgba(255,255,255,.03);margin-bottom: 20px; }
.mini-title{ font-weight:600; margin-bottom:.5rem; color:rgba(255,255,255,.95); }
.mini-body{ color:rgba(255,255,255,.88); }
.soon{ display:inline-block; padding:.08rem .45rem; border-radius:.5rem; border:1px solid rgba(255,255,255,.18); font-size:.78rem; color:#ffd7a3; background:rgba(255,200,120,.12); }
.card-max-h{ height:fit-content; }

/* ================== Achievements grid ================== */
.ach-body{ margin-top:.25rem; }
.ach-grid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; }
.ach-tile{ display:flex; flex-direction:column; aspect-ratio:1/1; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,.10); background: radial-gradient(120% 120% at 10% -20%, rgba(160,190,255,.06), rgba(255,255,255,0) 60%), rgba(255,255,255,.03); transition:transform .12s, box-shadow .18s, border-color .18s; }
.ach-tile:hover{ transform:translateY(-2px); border-color:rgba(255,255,255,.18); box-shadow:0 10px 24px rgba(0,0,0,.35); }
.ach-imgwrap{ flex:1 1 auto; display:flex; align-items:center; justify-content:center; margin:10px 10px 8px; border-radius:10px; border:1px solid rgba(255,255,255,.06); background:rgba(0,0,0,.35); }
.ach-img{ max-width:76%; max-height:76%; object-fit:contain; }
.ach-placeholder{ font-size:28px; opacity:.9; }
.ach-footer{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:0 10px; min-height:22px; }
.ach-title{ flex:1 1 auto; min-width:0; font-size:12px; line-height:1.1; color:rgba(255,255,255,.95); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ach-badge{ font-size:10px; line-height:1; text-transform:uppercase; padding:.2rem .45rem; border-radius:6px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.06); color:rgba(255,255,255,.9); }
.ach-date{ text-align:center; font-size:10px; line-height:1; color:rgba(255,255,255,.55); padding:6px 10px 8px; }
.ach-skeleton{ background:linear-gradient(90deg, rgba(255,255,255,.05), rgba(255,255,255,.08), rgba(255,255,255,.05)); background-size:200% 100%; animation:achShimmer 1.2s infinite; }
@keyframes achShimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ================== Inventory grid ================== */
.inv-body{ padding-top:.25rem; }
.inv-grid{ display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; }
@media (min-width: 480px){ .inv-grid{ grid-template-columns:repeat(3, minmax(0, 1fr)); } }
@media (min-width: 900px){ .inv-grid{ grid-template-columns:repeat(4, minmax(0, 1fr)); } }

.inv-tile{ aspect-ratio:1/1; display:flex; flex-direction:column; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,.10); background: radial-gradient(120% 120% at 10% -20%, rgba(160,190,255,.06), rgba(255,255,255,0) 60%), rgba(255,255,255,.03); transition:transform .12s, box-shadow .18s, border-color .18s; }
.inv-tile:hover{ transform:translateY(-2px); border-color:rgba(255,255,255,.18); box-shadow:0 10px 24px rgba(0,0,0,.35); }
.inv-imgwrap{ flex:1 1 auto; display:flex; align-items:center; justify-content:center; margin:10px; border-radius:10px; border:1px solid rgba(255,255,255,.06); background:rgba(0,0,0,.35); }
.inv-img{ max-width:78%; max-height:78%; object-fit:contain; filter:drop-shadow(0 2px 6px rgba(0,0,0,.6)); }
.inv-footer{ display:flex; flex-direction:column; align-items:flex-start; gap:6px; padding:0 10px; min-height:22px; }
.inv-name{ flex:1 1 auto; min-width:0; font-size:12px; line-height:1.1; color:rgba(255,255,255,.95); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.inv-badge{ font-size:10px; line-height:1; text-transform:uppercase; padding:.2rem .45rem; border-radius:6px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.06); color:rgba(255,255,255,.9); }
.inv-date{ text-align:left; font-size:10px; line-height:1; color:rgba(255,255,255,.55); padding:6px 10px 8px; }
.inv-skeleton{ background:linear-gradient(90deg, rgba(255,255,255,.05), rgba(255,255,255,.08), rgba(255,255,255,.05)); background-size:200% 100%; animation:invShimmer 1.2s infinite; }
@keyframes invShimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Палитра бейджей */
.badge-legendary{ background:rgba(255,210,90,.18); color:#ffe18a; border:1px solid rgba(255,210,90,.35); }
.badge-epic{ background:rgba(170,120,255,.18); color:#decbff; border:1px solid rgba(170,120,255,.35); }
.badge-rare{ background:rgba(110,170,255,.18); color:#cfe3ff; border:1px solid rgba(110,170,255,.35); }
.badge-uncommon{ background:rgba(90,210,140,.18); color:#c6ffd9; border:1px solid rgba(90,210,140,.35); }
.badge-common{ background:rgba(255,255,255,.08); color:rgba(255,255,255,.9); border:1px solid rgba(255,255,255,.16); }
</style>
