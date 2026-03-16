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
const profile = reactive<{ username: string; avatar_url: string | null; bio: string | null }>({
  username: "",
  avatar_url: null,
  bio: null,
});
const form = reactive<{ username: string; avatar_url: string | null; bio: string }>({
  username: "",
  avatar_url: null,
  bio: "",
});

const pageLoading = ref(true);
const pending = ref(false);
const msg = ref<string | null>(null);
const err = ref<string | null>(null);
function goChat(otherId: string) {
  // просто открываем страницу мессенджера с выбранным собеседником
  router.push({ path: "/messages", query: { to: otherId } });
}

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
type InvRow = {
  item_id: string;
  name: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | string;
  icon_url: string | null;
  acquired_at: string;
};
const invLoading = ref(false);
const invRows = ref<InvRow[]>([]);
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
  } catch {
    achRows.value = [];
  } finally {
    achLoading.value = false;
  }
}

/* ------------ FRIENDS ------------ */
type FriendItem = {
  user_id: string; // id другого человека
  username: string | null;
  avatar_url: string | null;
};

const friendsLoading = ref(false);
const friends = ref<FriendItem[]>([]);
const incoming = ref<FriendItem[]>([]);
const outgoing = ref<FriendItem[]>([]);

async function loadFriends(userId: string) {
  friendsLoading.value = true;
  friends.value = [];
  incoming.value = [];
  outgoing.value = [];

  try {
    // берём все записи, где я либо requester, либо addressee
    const { data, error } = await supabase
      .from("friendships")
      .select("id, requester, addressee, status")
      .or(`requester.eq.${userId},addressee.eq.${userId}`);
    if (error) throw error;

    if (!data || data.length === 0) return;

    // ids всех "вторых" пользователей
    const otherIds = new Set<string>();
    for (const row of data) {
      const otherId = row.requester === userId ? row.addressee : row.requester;
      otherIds.add(otherId);
    }

    // заберём их профили
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", Array.from(otherIds));

    const profMap = new Map<
      string,
      { username: string | null; avatar_url: string | null }
    >();
    (profs ?? []).forEach((p) => {
      // нормализуем аватар: может быть путь
      let url = p.avatar_url as string | null;
      if (url && !/^https?:\/\//i.test(url)) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(url);
        url = data.publicUrl || null;
      }
      profMap.set(p.id, { username: p.username, avatar_url: url });
    });

    for (const row of data) {
      const otherId = row.requester === userId ? row.addressee : row.requester;
      const prof = profMap.get(otherId) || { username: null, avatar_url: null };
      const entry: FriendItem = {
        user_id: otherId,
        username: prof.username,
        avatar_url: prof.avatar_url,
      };

      if (row.status === "accepted") {
        friends.value.push(entry);
      } else if (row.status === "pending") {
        if (row.addressee === userId) {
          incoming.value.push(entry);
        } else {
          outgoing.value.push(entry);
        }
      }
    }
  } finally {
    friendsLoading.value = false;
  }
}

async function acceptIncomingFriend(otherId: string) {
  const uid = user.value?.id;
  if (!uid) return;
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("requester", otherId)
    .eq("addressee", uid);
  if (!error) {
    await loadFriends(uid);
  }
}

async function cancelOutgoingFriend(otherId: string) {
  const uid = user.value?.id;
  if (!uid) return;
  await supabase
    .from("friendships")
    .delete()
    .eq("requester", uid)
    .eq("addressee", otherId);
  await loadFriends(uid);
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

const avatarSrc = computed<string | null>(() => {
  const u = profile.avatar_url || null;
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  const { data } = supabase.storage.from("avatars").getPublicUrl(u);
  return data.publicUrl || null;
});

const publicProfileUrl = computed(() => {
  if (!profile.username) return "";
  const path = `/u/${encodeURIComponent(profile.username)}`;
  return typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
});
const highlights = computed(() => [
  { label: "Friends", value: String(friends.value.length) },
  { label: "Incoming", value: String(incoming.value.length) },
  { label: "Outgoing", value: String(outgoing.value.length) },
  { label: "Achievements", value: String(achRows.value.length) },
  { label: "Inventory", value: String(invItems.value.length) },
  { label: "Public profile", value: publicProfileUrl.value ? "Ready" : "No username" },
]);

const joinedAt = computed<string | null>(() => {
  const created = (user.value as any)?.created_at;
  if (!created) return null;
  const d = new Date(created);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
});

const hasUnsavedChanges = computed(
  () =>
    form.username !== profile.username ||
    form.avatar_url !== profile.avatar_url ||
    form.bio !== (profile.bio || "")
);

const copiedId = ref(false);
async function copyMyId() {
  const id = user.value?.id;
  if (!id) return;
  try {
    await navigator.clipboard.writeText(id);
    copiedId.value = true;
    setTimeout(() => (copiedId.value = false), 1200);
  } catch {}
}

async function loadInventoryByUser(userId: string) {
  invLoading.value = true;
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("acquired_at, item_id, items(name, rarity, icon_url)")
      .eq("user_id", userId)
      .order("acquired_at", { ascending: false })
      .limit(8);
    if (error) throw error;

    invRows.value = (data ?? [])
      .map((row: any) => {
        const item = Array.isArray(row.items) ? row.items[0] : row.items;
        if (!item) return null;
        return {
          item_id: row.item_id,
          name: item.name ?? "Unknown item",
          rarity: item.rarity ?? "common",
          icon_url: item.icon_url ?? null,
          acquired_at: row.acquired_at,
        } as InvRow;
      })
      .filter(Boolean) as InvRow[];
  } catch {
    invRows.value = [];
  } finally {
    invLoading.value = false;
  }
}

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
      .select("username, avatar_url, bio")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    profile.username = data?.username ?? "";
    const raw = (data?.avatar_url as string | null) ?? null;
    if (raw && !/^https?:\/\//i.test(raw)) {
      const { data: url } = supabase.storage.from("avatars").getPublicUrl(raw);
      profile.avatar_url = url.publicUrl || null;
    } else {
      profile.avatar_url = raw;
    }
    form.username = profile.username;
    form.avatar_url = profile.avatar_url;
    profile.bio = (data?.bio as string | null) ?? null;
    form.bio = profile.bio ?? "";
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
    const uname = (form.username || "").trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname)) {
      throw new Error("Username: 3–20 letters, digits or _");
    }

    const { data: existing, error: existsErr } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", uname.replace(/([\\%_])/g, "\\$1"))
      .maybeSingle();
    if (existsErr && existsErr.code !== "PGRST116") throw existsErr;
    if (existing?.id && existing.id !== currentId) {
      throw new Error("This username is already taken");
    }

    const { error: upErr } = await supabase.from("profiles").upsert({
      id: currentId,
      username: uname,
      avatar_url: form.avatar_url ?? null,
      bio: form.bio.trim() || null,
    });
    if (upErr) throw upErr;

    profile.username = uname;
    profile.avatar_url = form.avatar_url;
    profile.bio = form.bio.trim() || null;
    msg.value = "Profile updated";

    window.dispatchEvent(
      new CustomEvent("profile:updated", {
        detail: { username: profile.username, avatar_url: profile.avatar_url },
      })
    );

    await loadAchievementsByUser(currentId);
    await loadInventoryByUser(currentId);
    await loadFriends(currentId);
  } catch (e: any) {
    const m = e?.message ?? "Failed to update profile";
    err.value = m;
    showErrorPopup(m, "Update error");
  } finally {
    pending.value = false;
  }
}

/* ------------ avatar upload ------------ */
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
    if (!uid) return;
    await loadProfile(uid);
    await loadAchievementsByUser(uid);
    await loadInventoryByUser(uid);
    await loadFriends(uid);
  } finally {
    pageLoading.value = false;
  }
});
</script>

<template>
  <main class="p-6 section mx-auto mt-10 account-page">
    <UiSpinner
      :overlay="true"
      :open="pageLoading || pending"
      label="Working…"
    />
    <div class="flex justify-between items-center">
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight">Account Core</h1>
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

    <section v-else class="mt-4 grid gap-6 md:grid-cols-[320px,1fr] account-shell">
      <!-- LEFT -->
      <div class="card p-4 glass-card glass-panel card-fc account-card">
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

          <div class="w-full account-meta">
            <div class="meta-row">
              <div class="meta-key">ID</div>
              <div class="meta-val">
                <span class="mono">{{ user?.id || "—" }}</span>
                <button type="button" class="copy-btn" :disabled="!user?.id" @click="copyMyId" title="Copy ID">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M8 8h12v12H8z" stroke="currentColor" stroke-width="1.5" />
                    <path d="M4 4h12v12H4z" stroke="currentColor" stroke-width="1.5" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="meta-row">
              <div class="meta-key">Joined</div>
              <div class="meta-val">{{ joinedAt || "—" }}</div>
            </div>

            <div class="meta-row">
              <div class="meta-key">Public</div>
              <div class="meta-val">
                <a v-if="publicProfileUrl" :href="publicProfileUrl" target="_blank" rel="noopener" class="meta-link">
                  {{ publicProfileUrl }}
                </a>
                <span v-else class="text-white/40">Set username first</span>
              </div>
            </div>

            <p v-if="copiedId" class="text-[11px] text-green-300/90 mt-2 text-right">ID copied</p>
          </div>

          <button
            type="button"
            class="glass-btn comet account-side-btn w-full"
            :disabled="!profile.avatar_url"
            @click="removeAvatar"
          >
            <svg viewBox="0 0 24 24" class="ico">
              <path d="M6 7h12M9 7V5h6v2m-7 3l1 9h6l1-9" />
            </svg>
            Remove avatar
          </button>

          <button type="button" class="glass-btn comet account-side-btn w-full" @click="sendResetPassword">
            <svg viewBox="0 0 24 24" class="ico">
              <path d="M12 5v6l4 2M12 3a9 9 0 109 9" />
            </svg>
            Reset password
          </button>

          <button
            type="button"
            class="glass-btn comet account-side-btn account-side-btn--danger w-full"
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
      <div class="card p-4 md:p-6 glass-card glass-panel account-card">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold">Profile settings</h2>
            <p class="text-xs text-white/55 mt-1">Manage public profile and avatar</p>
          </div>
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

        <Transition name="settings-bar">
          <div v-if="hasUnsavedChanges" class="settings-savebar mt-4">
            <div class="text-xs text-white/70">You have unsaved settings changes</div>
            <div class="flex items-center gap-2">
              <button
                class="glass-btn comet account-cancel-btn"
                @click="
                  form.username = profile.username;
                  form.avatar_url = profile.avatar_url;
                  form.bio = profile.bio || '';
                "
              >
                Cancel
              </button>
              <button class="glass-btn comet account-save-btn" @click="saveProfile">
                Save changes
              </button>
            </div>
          </div>
        </Transition>

        <div class="mt-4 space-y-4">
          <div>
            <label class="block text-sm mb-1">Email</label>
            <input
              :value="email"
              disabled
              class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 opacity-80 account-input"
            />
          </div>

          <div>
            <label class="block text-sm mb-1">Username</label>
            <input
              v-model.trim="form.username"
              placeholder="your_nickname"
              class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent account-input"
            />
            <p class="text-xs text-white/50 mt-1">
              3–20 letters, digits or underscore. Unique.
            </p>
          </div>

          <div>
            <label class="block text-sm mb-1">Bio</label>
            <textarea
              v-model.trim="form.bio"
              rows="3"
              placeholder="Tell something about yourself"
              class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-eter-accent resize-y account-input"
            />
            <p class="text-xs text-white/50 mt-1">Shown on your public profile</p>
          </div>

          <div v-if="publicProfileUrl">
            <label class="block text-sm mb-1">Public profile link</label>
            <a
              :href="publicProfileUrl"
              target="_blank"
              rel="noopener"
              class="block w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/80 underline underline-offset-2 break-all account-link"
            >
              {{ publicProfileUrl }}
            </a>
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

        <div class="sep my-6"></div>
        <h3 class="text-base font-semibold mb-3">Highlights</h3>
        <div class="hl-grid mb-6">
          <div v-for="h in highlights" :key="h.label" class="hl-card">
            <div class="hl-label">{{ h.label }}</div>
            <div class="hl-value">{{ h.value }}</div>
          </div>
        </div>

        <div class="mini-card mb-6">
          <div class="mini-title-row">
            <h4 class="mini-title m-0">Inventory</h4>
            <RouterLink to="/inventory" class="mini-link">View all</RouterLink>
          </div>
          <div v-if="invLoading && invItems.length === 0" class="text-white/60 text-sm">Loading inventory…</div>
          <div v-else-if="invItems.length === 0" class="text-white/50 text-sm">No items yet.</div>
          <div v-else class="inv-grid-mini">
            <div v-for="it in invItems.slice(0, 6)" :key="it.key" class="inv-tile-mini">
              <div class="inv-mini-imgwrap">
                <img v-if="it.icon_url" :src="it.icon_url" :alt="it.name" class="inv-mini-img" loading="lazy" />
                <div v-else class="inv-mini-ph">?</div>
              </div>
              <div class="inv-mini-name" :title="it.name">{{ it.name }}</div>
            </div>
          </div>
        </div>

        <!-- ===== FRIENDS SECTION ===== -->
        <h3 class="text-base font-semibold mb-3">Friends</h3>
        <div v-if="friendsLoading" class="text-white/60 text-sm">
          Loading friends…
        </div>
        <div v-else class="space-y-4">
          <!-- accepted -->
          <div>
            <h4 class="text-sm text-white/60 mb-2">Your friends</h4>
            <div v-if="friends.length === 0" class="text-white/35 text-sm">
              No friends yet.
            </div>
           <div v-else class="flex flex-wrap gap-2">
  <div v-for="f in friends" :key="f.user_id" class="friend-pill">
    <RouterLink
      :to="f.username ? `/u/${encodeURIComponent(f.username)}` : `/users`"
      class="flex items-center gap-2 shrink-0"
    >
      <img
        v-if="f.avatar_url"
        :src="f.avatar_url"
        class="w-6 h-6 rounded-full object-cover"
      />
      <div
        v-else
        class="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-xs"
      >
        {{ (f.username || "U").slice(0, 1).toUpperCase() }}
      </div>
      <span>{{ f.username || f.user_id.slice(0, 8) }}</span>
    </RouterLink>
    <!-- 👇 вот эта кнопка -->
    <button class="mini-btn" @click="goChat(f.user_id)">Message</button>
  </div>
</div>

          </div>

          <!-- incoming -->
          <div v-if="incoming.length">
            <h4 class="text-sm text-white/60 mb-2">Incoming requests</h4>
            <div class="flex flex-wrap gap-2">
              <div v-for="f in incoming" :key="f.user_id" class="friend-pill">
                <RouterLink
                  :to="
                    f.username
                      ? `/u/${encodeURIComponent(f.username)}`
                      : `/users`
                  "
                  class="flex items-center gap-2 shrink-0"
                >
                  <img
                    v-if="f.avatar_url"
                    :src="f.avatar_url"
                    class="w-6 h-6 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-xs"
                  >
                    {{ (f.username || "U").slice(0, 1).toUpperCase() }}
                  </div>
                  <span>{{ f.username || f.user_id.slice(0, 8) }}</span>
                </RouterLink>
                <button
                  class="mini-btn"
                  @click="acceptIncomingFriend(f.user_id)"
                >
                  Accept
                </button>
                <button class="mini-btn" @click="goChat(f.user_id)">Message</button>
              </div>
            </div>
          </div>

          <!-- outgoing -->
          <div v-if="outgoing.length">
            <h4 class="text-sm text-white/60 mb-2">Outgoing requests</h4>
            <div class="flex flex-wrap gap-2">
              <div v-for="f in outgoing" :key="f.user_id" class="friend-pill">
                <RouterLink
                  :to="
                    f.username
                      ? `/u/${encodeURIComponent(f.username)}`
                      : `/users`
                  "
                  class="flex items-center gap-2 shrink-0"
                >
                  <img
                    v-if="f.avatar_url"
                    :src="f.avatar_url"
                    class="w-6 h-6 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-xs"
                  >
                    {{ (f.username || "U").slice(0, 1).toUpperCase() }}
                  </div>
                  <span>{{ f.username || f.user_id.slice(0, 8) }}</span>
                </RouterLink>
                <!-- <button class="mini-btn" @click="goChat(f.user_id)">Message</button> -->
                <button
                  class="mini-btn"
                  @click="cancelOutgoingFriend(f.user_id)"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
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
.account-page {
  position: relative;
}


.account-shell {
  position: relative;
  z-index: 1;
}

.card {
  border: 1px solid rgba(160, 126, 255, 0.18);
  border-radius: 20px;
  background: radial-gradient(
      110% 95% at 12% -15%,
      rgba(192, 124, 255, 0.18),
      rgba(255, 255, 255, 0) 60%
    ),
    linear-gradient(180deg, rgba(20, 18, 33, 0.88), rgba(10, 11, 18, 0.9));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 22px 48px rgba(0, 0, 0, 0.48),
    0 0 22px rgba(182, 110, 255, 0.15);
}

.account-card {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}
.account-card:hover {
  border-color: rgba(188, 132, 255, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 28px 56px rgba(0, 0, 0, 0.54),
    0 0 28px rgba(182, 110, 255, 0.22);
  transform: translateY(-1px);
}
.sep {
  height: 1px;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(170,128,255,0.35), rgba(255,255,255,0));
}

.account-input,
.account-link {
  border-color: rgba(164, 130, 255, 0.22) !important;
  background:
    radial-gradient(120% 95% at 12% -22%, rgba(186, 106, 255, 0.16), rgba(186, 106, 255, 0) 58%),
    rgba(255,255,255,0.03) !important;
  color: rgba(255,255,255,0.95);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),
    0 6px 16px rgba(0,0,0,0.24);
}
.account-input:focus {
  border-color: rgba(198, 132, 255, 0.5) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.1),
    0 0 0 3px rgba(186,96,255,0.16),
    0 8px 18px rgba(0,0,0,0.3);
}
.account-input::placeholder {
  color: rgba(255,255,255,0.45);
}

.account-save-btn,
.account-cancel-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  min-height: 36px;
  padding: 0 .92rem;
  border-radius: 10px;
  line-height: 1;
  white-space: nowrap;
}

.account-save-btn {
  border: 1px solid rgba(224, 154, 255, 0.72) !important;
  color: #fff !important;
  font-weight: 700;
  letter-spacing: .01em;
  background:
    radial-gradient(120% 130% at 12% -25%, rgba(234, 156, 255, 0.54), rgba(234, 156, 255, 0) 58%),
    linear-gradient(135deg, rgba(168, 76, 255, 0.98), rgba(118, 36, 224, 0.96)) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.28),
    0 14px 30px rgba(122, 34, 214, 0.42),
    0 0 24px rgba(206, 110, 255, 0.36) !important;
  transition: transform .16s ease, box-shadow .18s ease, filter .18s ease;
}
.account-save-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.3),
    0 18px 36px rgba(122, 34, 214, 0.5),
    0 0 32px rgba(206, 110, 255, 0.45);
}
.account-save-btn:active {
  transform: translateY(0);
}

.account-cancel-btn {
  font-weight: 600;
  border-color: rgba(166, 130, 255, 0.28) !important;
  background:
    radial-gradient(120% 130% at 12% -25%, rgba(184, 112, 255, 0.22), rgba(184, 112, 255, 0) 58%),
    linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)) !important;
}

.settings-savebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid rgba(168, 132, 255, 0.25);
  border-radius: 12px;
  padding: 8px 10px;
  background:
    radial-gradient(100% 120% at 10% -20%, rgba(182,110,255,0.18), rgba(182,110,255,0) 58%),
    rgba(255,255,255,0.03);
}

.settings-bar-enter-active,
.settings-bar-leave-active {
  transition: opacity .2s ease, transform .2s ease, filter .2s ease;
}
.settings-bar-enter-from,
.settings-bar-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(.985);
  filter: blur(2px);
}

.account-side-btn {
  height: 28px;
  min-height: 28px;
  padding: 0 .72rem !important;
  border-radius: 9999px !important;
  font-size: 12px !important;
  line-height: 1 !important;
}

.account-side-btn .ico {
  width: 14px;
  height: 14px;
}

.account-side-btn--danger {
  border-color: rgba(255, 112, 112, 0.48) !important;
  color: #ffc1c1 !important;
  background:
    radial-gradient(120% 130% at 12% -25%, rgba(255, 110, 110, 0.18), rgba(255, 110, 110, 0) 58%),
    linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)) !important;
}

.account-side-btn--danger:hover {
  border-color: rgba(255, 132, 132, 0.65) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.18),
    0 14px 30px rgba(0,0,0,0.4),
    0 0 20px rgba(255, 102, 102, 0.22) !important;
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
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9rem;
  line-height: 1.25;
}
.account-meta {
  width: 100%;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.hl-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
@media (min-width: 768px) {
  .hl-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.hl-card {
  border: 1px solid rgba(165, 130, 255, 0.2);
  border-radius: 12px;
  padding: 10px 12px;
  background:
    radial-gradient(100% 100% at 16% -20%, rgba(182,110,255,0.14), rgba(182,110,255,0) 65%),
    rgba(255, 255, 255, 0.03);
}
.hl-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.hl-value {
  margin-top: 4px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  overflow-wrap: anywhere;
}
.mini-card {
  border: 1px solid rgba(165, 130, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  background:
    radial-gradient(100% 100% at 12% -20%, rgba(182,110,255,0.12), rgba(182,110,255,0) 60%),
    rgba(255, 255, 255, 0.02);
}
.mini-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.mini-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}
.mini-link {
  font-size: 12px;
  color: #cfe0ff;
  text-decoration: underline dotted;
}
.inv-grid-mini {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
@media (min-width: 768px) {
  .inv-grid-mini {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.inv-tile-mini {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.02);
}
.inv-mini-imgwrap {
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.inv-mini-img {
  width: 72%;
  height: 72%;
  object-fit: contain;
}
.inv-mini-ph {
  color: rgba(255, 255, 255, 0.45);
}
.inv-mini-name {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta-row {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.meta-row:first-child {
  border-top: 0;
}
.meta-key {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}
.meta-val {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  color: rgba(255, 255, 255, 0.92);
  text-align: right;
  font-size: 0.86rem;
  line-height: 1.25;
}
.meta-link {
  color: #cfe0ff;
  text-decoration: underline dotted;
  overflow-wrap: anywhere;
  word-break: break-word;
  font-size: 0.86rem;
  line-height: 1.25;
}
.copy-btn {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
}
.copy-btn:disabled {
  opacity: 0.5;
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

.friend-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background:
    radial-gradient(100% 100% at 12% -18%, rgba(182,110,255,0.12), rgba(182,110,255,0) 60%),
    rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(165, 130, 255, 0.2);
  border-radius: 9999px;
  padding: 4px 10px 4px 4px;
  font-size: 13px;
}
.mini-btn {
  background:
    radial-gradient(100% 100% at 14% -22%, rgba(182,110,255,0.16), rgba(182,110,255,0) 62%),
    rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(165, 130, 255, 0.28);
  border-radius: 9999px;
  padding: 3px 10px;
  font-size: 11px;
  line-height: 1;
  color: rgba(255,255,255,0.94);
}
.mini-btn:hover {
  border-color: rgba(186,96,255,0.48);
  box-shadow: 0 0 14px rgba(186,96,255,0.22);
}
.link-pill {
  text-decoration: none;
  color: inherit;
}
.link-pill:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

@media (max-width: 640px) {
  .settings-savebar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
