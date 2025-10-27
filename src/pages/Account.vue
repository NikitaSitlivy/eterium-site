<!-- pages/Account.vue -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { supabase } from "../lib/superbase";
import UiSpinner from "../components/UiSpinner.vue";
import UiPopup from "../components/UiPopup.vue";
import AvatarRules from "../components/AvatarRules.vue";
import AvatarDropzone from "../components/AvatarDropzone.vue";

/* ------------ auth / router ------------ */
const router = useRouter();
const { user, isAuthed, signOut } = useAuth();

/* ------------ state ------------ */
const profile = reactive<{ username: string; avatar_url: string | null }>({
  username: "",
  avatar_url: null,
});
const form = reactive<{ username: string; avatar_url: string | null }>({
  username: "",
  avatar_url: null,
});

const pageLoading = ref(true); // начальная загрузка страницы
const pending = ref(false); // локальные операции (save, upload, etc.)
const msg = ref<string | null>(null);
const err = ref<string | null>(null);

/* ------------ achievements ------------ */
type AchRow = {
  id: string;
  title: string;
  icon_url: string | null;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | string;
  earned_at: string;
};
const achLoading = ref(false);
const achRows = ref<AchRow[]>([]);

function rarityClass(r: string) {
  if (r === "legendary")
    return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
  if (r === "epic")
    return "bg-purple-500/20 text-purple-300 border border-purple-500/30";
  if (r === "rare")
    return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
  if (r === "uncommon")
    return "bg-green-500/20 text-green-300 border border-green-500/30";
  return "bg-white/10 text-white/80 border border-white/10";
}

async function loadAchievementsByUser(userId: string) {
  achLoading.value = true;
  try {
    const { data, error } = await supabase
      .from("achievements")
      .select("id, title, icon_url, rarity, earned_at")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    achRows.value = data ?? [];
  } catch (e) {
    achRows.value = [];
  } finally {
    achLoading.value = false;
  }
}

/* ------------ popup ------------ */
const errPopupOpen = ref(false);
const errPopupTitle = ref("Action blocked");
const errPopupMsg = ref("");

function showErrorPopup(message: string, title = "Action blocked") {
  errPopupTitle.value = title;
  errPopupMsg.value = message;
  errPopupOpen.value = true;
}

/* ------------ computed ------------ */
const email = computed(() => user.value?.email ?? "");
const emailVerified = computed(() =>
  Boolean(
    (user.value as any)?.email_confirmed_at ||
      (user.value as any)?.email_confirmed
  )
);

// Derive a safe avatar URL (supports stored path or full URL)
const avatarSrc = computed<string | null>(() => {
  const u = profile.avatar_url || null
  if (!u) return null
  if (/^https?:\/\//i.test(u)) return u
  const { data } = supabase.storage.from('avatars').getPublicUrl(u)
  return data.publicUrl || null
})

/* ------------ helpers: avatars ------------ */
function extractAvatarPath(
  publicUrl: string | null | undefined
): string | null {
  if (!publicUrl) return null;
  const m = publicUrl.match(/\/object\/public\/avatars\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}
async function deleteAvatarFromStorage(publicUrl: string | null | undefined) {
  const path = extractAvatarPath(publicUrl);
  if (!path) return;
  await supabase.storage
    .from("avatars")
    .remove([path])
    .catch(() => {});
}

/* ------------ load/save profile ------------ */
async function loadProfile(userId: string) {
  err.value = null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    profile.username = data?.username ?? "";
    // Normalize avatar URL: allow path or full URL in DB
    const raw = (data?.avatar_url as string | null) ?? null
    if (raw && !/^https?:\/\//i.test(raw)) {
      const { data: url } = supabase.storage.from('avatars').getPublicUrl(raw)
      profile.avatar_url = url.publicUrl || null
    } else {
      profile.avatar_url = raw
    }
    form.username = profile.username;
    form.avatar_url = profile.avatar_url;
  } catch (e: any) {
    const m = e?.message ?? "Failed to load profile";
    err.value = m;
    showErrorPopup(m, "Load error");
  }
}

async function saveProfile() {
  const currentId = user.value?.id;
  if (!currentId) return;

  msg.value = null;
  err.value = null;
  pending.value = true;
  try {
    const uname = (form.username || "").trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname)) {
      throw new Error("Username: 3–20 letters, digits or _");
    }

    // проверка уникальности
    const { data: existing, error: existsErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", uname)
      .maybeSingle();
    if (existsErr && existsErr.code !== "PGRST116") throw existsErr;
    if (existing?.id && existing.id !== currentId) {
      throw new Error("This username is already taken");
    }

    const { error: upErr } = await supabase
      .from("profiles")
      .upsert({
        id: currentId,
        username: uname,
        avatar_url: form.avatar_url ?? null,
      });
    if (upErr) throw upErr;

    profile.username = uname;
    profile.avatar_url = form.avatar_url;
    msg.value = "Profile updated";

    window.dispatchEvent(
      new CustomEvent("profile:updated", {
        detail: { username: profile.username, avatar_url: profile.avatar_url },
      })
    );

    // подтянуть достижения на всякий случай
    await loadAchievementsByUser(currentId);
  } catch (e: any) {
    const m = e?.message ?? "Failed to update profile";
    err.value = m;
    showErrorPopup(m, "Update error");
  } finally {
    pending.value = false;
  }
}

/* ------------ avatar upload (DnD) ------------ */
const MAX_MB = 3;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const acknowledged = ref(false);

async function handleFile(file: File) {
  const currentId = user.value?.id;
  if (!currentId) return;

  if (!ALLOWED.includes(file.type)) {
    return showErrorPopup("Only JPG, PNG or WebP are allowed", "Upload error");
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return showErrorPopup(`Max file size is ${MAX_MB}MB`, "Upload error");
  }

  pending.value = true;
  msg.value = null;
  err.value = null;
  try {
    await deleteAvatarFromStorage(profile.avatar_url);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${currentId}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
    if (upErr) throw upErr;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    form.avatar_url = data.publicUrl;

    const { error: upErr2 } = await supabase
      .from("profiles")
      .upsert({ id: currentId, avatar_url: form.avatar_url });
    if (upErr2) throw upErr2;

    profile.avatar_url = form.avatar_url;
    msg.value = "Avatar updated";

    window.dispatchEvent(
      new CustomEvent("profile:updated", {
        detail: { username: profile.username, avatar_url: profile.avatar_url },
      })
    );
  } catch (e: any) {
    const m = e?.message ?? "Failed to upload avatar";
    err.value = m;
    showErrorPopup(m, "Upload error");
  } finally {
    pending.value = false;
  }
}

async function removeAvatar() {
  const currentId = user.value?.id;
  if (!currentId) return;

  pending.value = true;
  msg.value = null;
  err.value = null;
  try {
    await deleteAvatarFromStorage(profile.avatar_url);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: currentId, avatar_url: null });
    if (error) throw error;
    form.avatar_url = null;
    profile.avatar_url = null;
    msg.value = "Avatar removed";
    window.dispatchEvent(
      new CustomEvent("profile:updated", {
        detail: { username: profile.username, avatar_url: profile.avatar_url },
      })
    );
  } catch (e: any) {
    const m = e?.message ?? "Failed to remove avatar";
    err.value = m;
    showErrorPopup(m, "Remove avatar");
  } finally {
    pending.value = false;
  }
}

/* ------------ auth utils ------------ */
async function sendResetPassword() {
  const addr = email.value;
  if (!addr) return;
  pending.value = true;
  msg.value = null;
  err.value = null;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(addr, {
      redirectTo: `${window.location.origin}/reset`,
    } as any);
    if (error) throw error;
    msg.value = "We’ve sent a reset link to your email.";
  } catch (e: any) {
    const m = e?.message ?? "Failed to send reset email";
    err.value = m;
    showErrorPopup(m, "Reset password");
  } finally {
    pending.value = false;
  }
}

async function doLogout() {
  pending.value = true;
  try {
    await signOut();
    router.push("/");
  } finally {
    pending.value = false;
  }
}

/* ------------ init ------------ */
onMounted(async () => {
  try {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) {
      // нет логина — просто показываем страницу без данных
      return;
    }
    await loadProfile(uid);
    await loadAchievementsByUser(uid);
  } finally {
    pageLoading.value = false;
  }
});
</script>

<template>
  <main class="p-6 section mx-auto mt-10">
    <UiSpinner
      :overlay="true"
      :open="pageLoading || pending"
      label="Working…"
    />
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold">Account</h1>
      <div class="mt-3 flex items-center gap-2">
        <RouterLink to="/users" class="nav-cta">
          <!-- 🔎 иконка -->
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            class="inline-block mr-1 align-[-2px]"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M20 20l-3.5-3.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          Find players
        </RouterLink>
      </div>
    </div>
    <div v-if="!isAuthed && !pageLoading" class="mt-4 text-white/80">
      You are not signed in.
    </div>

    <section v-else class="mt-4 grid gap-6 md:grid-cols-[320px,1fr]">
      <!-- LEFT -->
      <div class="card p-4 glass-card glass-panel card-fc">
        <div class="flex flex-col items-center gap-4">
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            alt="avatar"
            class="w-28 h-28 rounded-full object-cover border border-white/10"
              referrerpolicy="no-referrer"
          />
          <div
            v-else
            class="w-28 h-28 rounded-full grid place-items-center border border-white/10 text-xl font-semibold bg-white/5"
          >
            {{
              (profile.username || email.split("@")[0] || "U")
                .slice(0, 1)
                .toUpperCase()
            }}
          </div>

          <button
            type="button"
            class="btn btn--ghost w-full"
            :disabled="!profile.avatar_url"
            @click="removeAvatar"
          >
            <svg viewBox="0 0 24 24" class="ico">
              <path d="M6 7h12M9 7V5h6v2m-7 3l1 9h6l1-9" />
            </svg>
            Remove avatar
          </button>

          <button type="button" class="btn w-full" @click="sendResetPassword">
            <svg viewBox="0 0 24 24" class="ico">
              <path d="M12 5v6l4 2M12 3a9 9 0 109 9" />
            </svg>
            Reset password
          </button>

          <button
            type="button"
            class="btn btn--danger w-full"
            @click="doLogout"
          >
            <svg viewBox="0 0 24 24" class="ico">
              <path
                d="M16 17l5-5-5-5M21 12H9M13 21H7a2 2 0 01-2-2V5a2 2 0 012-2h6"
              />
            </svg>
            Log out
          </button>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="card p-4 md:p-6 glass-card glass-panel">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Profile</h2>
          <span
            v-if="email"
            class="text-xs px-2 py-1 rounded-full border"
            :class="
              emailVerified
                ? 'border-green-400/40 text-green-300'
                : 'border-amber-400/40 text-amber-300'
            "
          >
            {{ emailVerified ? "Email verified" : "Email not verified" }}
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
            <p class="text-xs text-white/50 mt-1">
              3–20 letters, digits or underscore. Unique.
            </p>
          </div>
        </div>
        <div class="sep my-6"></div>
        <h3 class="text-base font-semibold mb-3">Avatar</h3>
        <AvatarRules v-model="acknowledged" class="mb-3" />
        <AvatarDropzone
          :disabled="!acknowledged"
          accept="image/jpeg,image/png,image/webp"
          :note="`JPG / PNG / WEBP, up to ${MAX_MB}MB`"
          @file="handleFile"
        />

        <div class="mt-6 flex items-center gap-3">
          <button class="cta" @click="saveProfile">Save changes</button>
          <button
            class="nav-cta"
            v-if="
              form.username !== profile.username ||
              form.avatar_url !== profile.avatar_url
            "
            @click="
              form.username = profile.username;
              form.avatar_url = profile.avatar_url;
            "
          >
            Cancel
          </button>
        </div>
        <div class="sep my-6"></div>

        <h3 class="text-base font-semibold mb-3">Achievements</h3>
        <div class="ach-body">
          <div v-if="achLoading" class="ach-grid">
            <div v-for="n in 6" :key="n" class="ach-tile ach-skeleton"></div>
          </div>
          <div v-else-if="achRows.length === 0" class="text-white/60">
            No achievements yet.
          </div>
          <div v-else class="ach-grid">
            <div v-for="a in achRows" :key="a.id" class="ach-tile">
              <div class="ach-imgwrap">
                <img
                  v-if="a.icon_url"
                  :src="a.icon_url"
                  :alt="a.title"
                  class="ach-img"
                  loading="lazy"
                />
                <div v-else class="ach-placeholder">🏆</div>
              </div>
              <div class="ach-footer">
                <div class="ach-title" :title="a.title">{{ a.title }}</div>
                <span class="ach-badge" :class="rarityClass(a.rarity)">{{
                  a.rarity
                }}</span>
              </div>
              <div class="ach-date">
                {{ new Date(a.earned_at).toLocaleDateString() }}
              </div>
            </div>
          </div>
        </div>

        <p v-if="msg" class="text-green-300/90 text-sm mt-3">{{ msg }}</p>
        <p v-if="err" class="text-red-400 text-sm mt-3">{{ err }}</p>
      </div>
    </section>

    <UiPopup
      :open="errPopupOpen"
      :title="errPopupTitle"
      :message="errPopupMsg"
      button-label="OK"
      variant="danger"
      @close="errPopupOpen = false"
    />
  </main>
</template>

<style scoped>
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
.sep {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

/* buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 8px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  width: 100%;
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
  transition: border-color 0.18s ease, box-shadow 0.18s ease,
    transform 0.12s ease, background 0.18s ease, opacity 0.18s ease;
}
.btn:hover {
  border-color: rgba(255, 255, 255, 0.24);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}
.btn:active {
  transform: translateY(0);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
.btn--danger {
  border-color: rgba(255, 80, 80, 0.35);
  color: #ffb4b4;
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
  box-shadow: 0 4px 14px rgba(255, 80, 80, 0.18);
}
.btn--ghost {
  background: rgba(255, 255, 255, 0.03);
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
.card-fc {
  height: fit-content;
}

/* === Achievements grid (flex, без position) === */
.ach-body {
  margin-top: 0.25rem;
}
.ach-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
.ach-tile {
  display: flex;
  flex-direction: column;
  aspect-ratio: 1/1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: radial-gradient(
      120% 120% at 10% -20%,
      rgba(160, 190, 255, 0.06),
      rgba(255, 255, 255, 0) 60%
    ),
    rgba(255, 255, 255, 0.03);
  transition: transform 0.12s ease, box-shadow 0.18s ease,
    border-color 0.18s ease;
}
.ach-tile:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.ach-imgwrap {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 10px 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.35);
}
.ach-img {
  max-width: 76%;
  max-height: 76%;
  object-fit: contain;
}
.ach-placeholder {
  font-size: 28px;
  opacity: 0.9;
}

.ach-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 10px;
  min-height: 22px;
}
.ach-title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12px;
  line-height: 1.1;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ach-badge {
  flex: 0 0 auto;
  font-size: 10px;
  line-height: 1;
  text-transform: uppercase;
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
}
.ach-date {
  text-align: center;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.55);
  padding: 6px 10px 8px;
}

/* skeletons */
.ach-skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.05)
  );
  background-size: 200% 100%;
  animation: achShimmer 1.2s infinite;
}
@keyframes achShimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* badge colors (для SSR/скоупа) */
.bg-yellow-500\/20.text-yellow-300.border.border-yellow-500\/30 {
  background: rgba(255, 210, 90, 0.18);
  color: #ffe18a;
  border-color: rgba(255, 210, 90, 0.35);
}
.bg-purple-500\/20.text-purple-300.border.border-purple-500\/30 {
  background: rgba(170, 120, 255, 0.18);
  color: #decbff;
  border-color: rgba(170, 120, 255, 0.35);
}
.bg-blue-500\/20.text-blue-300.border.border-blue-500\/30 {
  background: rgba(110, 170, 255, 0.18);
  color: #cfe3ff;
  border-color: rgba(110, 170, 255, 0.35);
}
.bg-green-500\/20.text-green-300.border.border-green-500\/30 {
  background: rgba(90, 210, 140, 0.18);
  color: #c6ffd9;
  border-color: rgba(90, 210, 140, 0.35);
}
.bg-white\/10.text-white\/80.border.border-white\/10 {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.16);
}
</style>
