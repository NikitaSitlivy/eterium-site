<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { supabase } from "../lib/superbase";
import UiSpinner from "../components/UiSpinner.vue";
import UiPopup from "../components/UiPopup.vue";
import AvatarRules from "../components/AvatarRules.vue"; 
import AvatarDropzone from "../components/AvatarDropzone.vue";

const router = useRouter();
const { user, isAuthed, signOut } = useAuth();


const profile = reactive<{ username: string; avatar_url: string | null }>({
  username: "",
  avatar_url: null,
});
const form = reactive<{ username: string; avatar_url: string | null }>({
  username: "",
  avatar_url: null,
});

const pending = ref(false);
const msg = ref<string | null>(null);
const err = ref<string | null>(null);

/* popup error */
const errPopupOpen = ref(false);
const errPopupTitle = ref("Action blocked");
const errPopupMsg = ref("");

function showErrorPopup(message: string, title = "Action blocked") {
  errPopupTitle.value = title;
  errPopupMsg.value = message;
  errPopupOpen.value = true;
}

/* basic computed */
const email = computed(() => user.value?.email ?? "");
const emailVerified = computed(() =>
  Boolean(
    (user.value as any)?.email_confirmed_at ||
      (user.value as any)?.email_confirmed
  )
);

/* ----------------------- helpers ----------------------- */
function extractAvatarPath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const m = publicUrl.match(/\/object\/public\/avatars\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}
async function deleteAvatarFromStorage(publicUrl: string | null | undefined) {
  const path = extractAvatarPath(publicUrl);
  if (!path) return;
  await supabase.storage.from("avatars").remove([path]).catch(() => {});
}

/* ----------------------- load/save profile ----------------------- */
async function loadProfile() {
  if (!user.value?.id) return;
  pending.value = true;
  err.value = null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.value.id)
      .maybeSingle();
    if (error) throw error;
    profile.username = data?.username ?? "";
    profile.avatar_url = data?.avatar_url ?? null;
    form.username = profile.username;
    form.avatar_url = profile.avatar_url;
  } catch (e: any) {
    const m = e?.message ?? "Failed to load profile";
    err.value = m;
    showErrorPopup(m, "Load error");
  } finally {
    pending.value = false;
  }
}

async function saveProfile() {
  if (!user.value?.id) return;
  err.value = null;
  msg.value = null;
  pending.value = true;
  try {
    const uname = (form.username || "").trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname)) {
      err.value = "Username: 3–20 letters, digits or _";
      return;
    }

    // проверка уникальности
    const { data: existing, error: existsErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", uname)
      .maybeSingle();
    if (existsErr && existsErr.code !== "PGRST116") throw existsErr;
    if (existing?.id && existing.id !== user.value.id) {
      err.value = "This username is already taken";
      return;
    }

    const { error: upErr } = await supabase
      .from("profiles")
      .upsert({
        id: user.value.id,
        username: uname,
        avatar_url: form.avatar_url ?? null,
      });
    if (upErr) throw upErr;

    profile.username = uname;
    profile.avatar_url = form.avatar_url;
    msg.value = "Profile updated";

    // чтобы заголовок сразу обновился
    window.dispatchEvent(
      new CustomEvent("profile:updated", {
        detail: { username: profile.username, avatar_url: profile.avatar_url },
      })
    );
  } catch (e: any) {
    const m = e?.message ?? "Failed to update profile";
    err.value = m;
    showErrorPopup(m, "Update error");
  } finally {
    pending.value = false;
  }
}

/* ----------------------- avatar upload (right column DnD) ----------------------- */
const MAX_MB = 3;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const fileInput = ref<HTMLInputElement | null>(null);
function openFilePicker() {
  fileInput.value?.click();
}
const dzOver = ref(false);
const acknowledged = ref(false);

function onDragOver(e: DragEvent) {
  e.preventDefault();
  dzOver.value = true;
}
function onDragLeave(e: DragEvent) {
  if (e.currentTarget === e.target) dzOver.value = false;
}
async function onDrop(e: DragEvent) {
  e.preventDefault();
  dzOver.value = false;
  if (!acknowledged.value) {
    showErrorPopup("Please confirm you follow the avatar rules.", "Upload");
    return;
  }
  const file = e.dataTransfer?.files?.[0];
  if (file) await handleFile(file);
}
async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!acknowledged.value) {
    showErrorPopup("Please confirm you follow the avatar rules.", "Upload");
    (e.target as HTMLInputElement).value = "";
    return;
  }
  await handleFile(file);
  (e.target as HTMLInputElement).value = "";
}
async function logUploadEvent({
  status,               // 'ok' | 'error'
  error,                // Error | { message?: string, code?: string } | null
  file,                 // File | null
  publicUrl,            // string | null
  bucket = 'avatars',   // по умолчанию наш бакет
  path = null as string | null,
}: {
  status: 'ok' | 'error',
  error?: any,
  file?: File | null,
  publicUrl?: string | null,
  bucket?: string,
  path?: string | null,
}) {
  const errMsg = error?.message ?? (typeof error === 'string' ? error : null) ?? null;
  const errCode = error?.code ?? null;

  const payload = {
    user_id:     user.value?.id ?? null,
    status,                      // 'ok' | 'error'
    error_message: errMsg,
    error_code:   errCode,
    file_name:    file?.name ?? path ?? null,
    file_url:     publicUrl ?? null,
    size_bytes:   file?.size ?? null,
    mime_type:    file?.type ?? null,
    bucket_id:    bucket,
    path:         path,
  };

  // Не даём логам падать основной флоу
  try {
    await supabase.from('upload_logs').insert(payload);
  } catch (logErr) {
    console.warn('upload_logs insert failed:', logErr);
  }
}

async function handleFile(file: File) {
  if (!user.value?.id) return;

  if (!ALLOWED.includes(file.type)) {
    const m = "Only JPG, PNG or WebP are allowed";
    err.value = m;
    showErrorPopup(m, "Upload error");
    return;
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    const m = `Max file size is ${MAX_MB}MB`;
    err.value = m;
    showErrorPopup(m, "Upload error");
    return;
  }

  err.value = null;
  msg.value = null;
  pending.value = true;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.value.id}/${Date.now()}.${ext}`;
  try {

    await deleteAvatarFromStorage(profile.avatar_url);
  // const fakeUserId = '11111111-2222-3333-4444-555555555555'
  // const ext = file.name.split('.').pop() || 'jpg'
  // const path = `${fakeUserId}/${Date.now()}.${ext}`
  

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (upErr) {
      const isRLS =
        /row-level security/i.test(upErr.message) || upErr.status === 403;
      if (isRLS) {
        showErrorPopup(
          `Upload blocked by security policy.<br/>You can only upload to your own folder.<br/><small class="opacity-80">(${upErr.message})</small>`,
          "Upload blocked"
        );
      } else {
        showErrorPopup(upErr.message || "Upload failed", "Upload error");
      }
      throw upErr;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    form.avatar_url = data.publicUrl;

    const { error: upErr2 } = await supabase
  .from('profiles')
  .upsert({ id: user.value.id, avatar_url: form.avatar_url })
if (upErr2) throw upErr2

// ... после успешного upload и upsert в profiles
await logUploadEvent({
  status: 'ok',
  file,
  publicUrl: form.avatar_url,
  bucket: 'avatars',
  path, // `${user.value.id}/${Date.now()}.${ext}`
});


    profile.avatar_url = form.avatar_url;
    msg.value = "Avatar updated";

    window.dispatchEvent(
      new CustomEvent("profile:updated", {
        detail: { username: profile.username, avatar_url: profile.avatar_url },
      })
    );
  } catch (e: any) {
     await logUploadEvent({
    status: 'error',
    error: e,   
    file,
    bucket: 'avatars',
    path,         
  });
    const m =
      e?.message ??
      'Failed to upload avatar (check bucket "avatars" and public access)';
    err.value = m;
    // showErrorPopup уже показали выше, но на всякий случай:
    if (!errPopupOpen.value) showErrorPopup(m, "Upload error");
  } finally {
    pending.value = false;
  }
}

/* ----------------------- remove avatar / password / logout ----------------------- */
async function removeAvatar() {
  if (!user.value?.id) return;
  err.value = null;
  msg.value = null;
  pending.value = true;
  try {
    await deleteAvatarFromStorage(profile.avatar_url);
    form.avatar_url = null;
    profile.avatar_url = null;

    const { error: upErr } = await supabase
      .from("profiles")
      .upsert({ id: user.value.id, avatar_url: null });
    if (upErr) throw upErr;

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

async function sendResetPassword() {
  if (!email.value) return;
  err.value = null;
  msg.value = null;
  pending.value = true;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
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

/* ----------------------- init ----------------------- */
onMounted(loadProfile);
</script>

<template>
  <main class="p-6 section mx-auto mt-10">
    <UiSpinner :overlay="true" :open="pending" label="Working…" />

    <h1 class="text-2xl font-semibold">Account</h1>

    <div v-if="!isAuthed" class="mt-4 text-white/80">
      You are not signed in.
    </div>

    <section v-else class="mt-4 grid gap-6 md:grid-cols-[320px,1fr]">
      <!-- LEFT: только действия -->
      <div class="card p-4 glass-card glass-panel card-fc">
        <div class="flex flex-col items-center gap-4">
          <img
            v-if="profile.avatar_url"
            :src="profile.avatar_url"
            alt="avatar"
            class="w-28 h-28 rounded-full object-cover border border-white/10"
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

          <button type="button" class="btn btn--danger w-full" @click="doLogout">
            <svg viewBox="0 0 24 24" class="ico">
              <path
                d="M16 17l5-5-5-5M21 12H9M13 21H7a2 2 0 01-2-2V5a2 2 0 012-2h6"
              />
            </svg>
            Log out
          </button>
        </div>
      </div>

      <!-- RIGHT: профиль + загрузка с DnD -->
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

        <!-- правила + свитч согласия -->
        <AvatarRules v-model="acknowledged" class="mb-3" />

        <!-- drag & drop зона -->
      
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

        <p v-if="msg" class="text-green-300/90 text-sm mt-3">{{ msg }}</p>
        <p v-if="err" class="text-red-400 text-sm mt-3">{{ err }}</p>
      </div>
    </section>

    <!-- error popup -->
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
.card{
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 16px;
  background:
    radial-gradient(120% 120% at 10% -20%, rgba(160,190,255,.08), rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(18,20,26,.9), rgba(12,14,18,.9));
  box-shadow: 0 12px 36px rgba(0,0,0,.45);
}
.sep{ height:1px; background: rgba(255,255,255,.08); }

/* кнопки */
.btn{
  display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
  padding:8px 12px; border-radius:9999px;
  border:1px solid rgba(255,255,255,.16);
  color:rgba(255,255,255,.92);
  font-size: 13px; width: 100%;
  background:
    radial-gradient(100% 80% at 20% -20%, rgba(255,255,255,.10) 0, rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
  transition: border-color .18s ease, box-shadow .18s ease, transform .12s ease, background .18s ease, opacity .18s ease;
}
.btn:hover{ border-color: rgba(255,255,255,.24); box-shadow: 0 6px 18px rgba(0,0,0,.35); transform: translateY(-1px); }
.btn:active{ transform: translateY(0); }
.btn:disabled{ opacity:.55; cursor:not-allowed; box-shadow:none; transform:none; }
.btn--danger{
  border-color: rgba(255,80,80,.35);
  color:#ffb4b4;
  background:
    radial-gradient(100% 80% at 20% -20%, rgba(255,80,80,.14) 0, rgba(255,80,80,0) 60%),
    linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
  box-shadow: 0 4px 14px rgba(255,80,80,.18);
}
.btn--ghost{ background: rgba(255,255,255,.03); }
.ico{ width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
.card-fc{
  height: fit-content;
}
/* dnd */
.dropzone{
  border: 1px dashed rgba(255,255,255,.22);
  border-radius: 14px;
  padding: 22px;
  background: rgba(255,255,255,.02);
  transition: all .15s ease;
  position: relative;
}
.dropzone.dragging{
  background: rgba(160,120,255,.10);
  border-color: rgba(160,120,255,.45);
  box-shadow: 0 0 0 3px rgba(160,120,255,.15) inset;
}
.dropzone.disabled{ opacity: .6; pointer-events: none; }
.dz-inner{ text-align:center; color: rgba(255,255,255,.86); }
.dz-ico{ font-size: 22px; opacity:.9; }
.dz-title{ font-weight: 600; margin-top: .35rem; }
.dz-sub{ font-size: .9rem; opacity:.8; }
.dz-note{ font-size: .8rem; opacity:.6; margin-top: .45rem; }
</style>
