<template>
  <header
    class="site-header fixed top-0 inset-x-0 z-40"
    :class="{ 'backdrop-supported': supportsBackdrop }"
  >
    <div class="accent-line"></div>

    <div class="section flex items-center justify-between h-14">
      <RouterLink
        to="/"
        class="font-extrabold tracking-tight text-lg md:text-xl flex items-center gap-2 hover:opacity-90"
      >
        Eterium
      </RouterLink>

      <nav class="hidden md:flex items-center gap-6 text-sm">
        <RouterLink v-slot="{ isActive }" to="/support">
          <span :class="linkClass(isActive)">Support</span>
        </RouterLink>
        <RouterLink v-slot="{ isActive }" to="/legal">
          <span :class="linkClass(isActive)">Legal</span>
        </RouterLink>
        <RouterLink v-slot="{ isActive }" to="/privacy">
          <span :class="linkClass(isActive)">Privacy</span>
        </RouterLink>
        <RouterLink v-if="isAuthed" v-slot="{ isActive }" to="/account">
          <span :class="linkClass(isActive)">Account</span>
        </RouterLink>
      </nav>

      <div class="hidden md:flex items-center gap-2">
        <button v-if="!isAuthed" class="nav-cta" @click.stop.prevent="onSignin">
          Sign in
        </button>
        <button
          v-if="!isAuthed"
          class="nav-cta nav-cta--accent"
          @click.stop.prevent="onSignup"
        >
          Sign up
        </button>

        <div v-else class="relative usermenu-root">
          <button class="user-pill" @click.stop.prevent="userMenu = !userMenu">
            <span class="avatar-dot">{{ avatarInitial }}</span>
            <span class="user-label">{{ displayLabel }}</span>
          </button>

          <div v-if="userMenu" class="user-menu">
            <RouterLink class="user-item" to="/account" @click="userMenu = false">
              <span class="ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm7 8a7 7 0 0 0-14 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </span>
              <span>Account</span>
            </RouterLink>

          

            <RouterLink class="user-item" to="/inventory" @click="userMenu = false">
              <span class="ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-6 9 6v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" stroke="currentColor" stroke-width="1.5"/><path d="M3 9h18M9 22V9m6 13V9" stroke="currentColor" stroke-width="1.5"/></svg>
              </span>
              <span>Inventory</span>
            </RouterLink>

            <RouterLink class="user-item" to="/store" @click="userMenu = false">
              <span class="ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7h16l-1 12H5L4 7Z" stroke="currentColor" stroke-width="1.5"/><path d="M7 7l1-3h8l1 3" stroke="currentColor" stroke-width="1.5"/></svg>
              </span>
              <span>Store</span>
            </RouterLink>

            <RouterLink class="user-item" to="/messages" @click="userMenu = false">
              <span class="ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12a7 7 0 0 1-7 7H7l-4 4V5a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7Z" transform="translate(0 3)" stroke="currentColor" stroke-width="1.5"/></svg>
              </span>
              <span class="flex items-center gap-2">
                Messages
                <span v-if="unreadCount > 0" class="badge ok">{{ unreadCount }}</span>
              </span>
            </RouterLink>

            <RouterLink class="user-item" to="/settings" @click="userMenu = false">
              <span class="ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 15.5a3.5 3.5 0 1 0-3.5-3.5 3.5 3.5 0 0 0 3.5 3.5ZM19.4 15a1.6 1.6 0 0 0 .32 1.76l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.6 1.6 0 0 0 15 19.4a1.6 1.6 0 0 0-1.5 1.1 2 2 0 0 1-3 0A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.76.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15 1.6 1.6 0 0 0 3.5 13.5a2 2 0 0 1 0-3A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.32-1.76l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.6 1.6 1.6 0 0 0 10.5 3.5a2 2 0 0 1 3 0A1.6 1.6 0 0 0 15 4.6a1.6 1.6 0 0 0 1.76-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9c.08.5.08 1 .08 1.5s0 1-.08 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
              </span>
              <span>Settings</span>
            </RouterLink>

            <RouterLink v-if="isAdmin" class="user-item" to="/admin" @click="userMenu = false">
              <span class="ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 5-3 7-8 8-5-1-8-3-8-8V7l8-4Z" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 12l1.5 1.5L14.5 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </span>
              <span>Admin</span>
            </RouterLink>

            <button class="user-item danger" @click.stop.prevent="onLogout">
              <span class="ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" stroke="currentColor" stroke-width="1.5"/><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </span>
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>

      <button
        class="md:hidden burger"
        @click="open = !open"
        :aria-expanded="open"
      >
        <span class="sr-only">Menu</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            :class="{ 'opacity-0': open }"
            d="M4 6h16M4 12h16M4 18h16"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            :class="{ 'opacity-100': open, 'opacity-0': !open }"
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <transition name="fade">
      <div v-if="open" class="md:hidden px-4 pb-4">
        <div class="drawer">
          <RouterLink class="drawer-link" to="/support" @click="open = false">Support</RouterLink>
          <RouterLink class="drawer-link" to="/legal" @click="open = false">Legal</RouterLink>
          <RouterLink class="drawer-link" to="/privacy" @click="open = false">Privacy</RouterLink>
          <RouterLink v-if="isAuthed" class="drawer-link" to="/account" @click="open = false">Account</RouterLink>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              v-if="!isAuthed"
              type="button"
              class="nav-cta"
              @click.stop.prevent="$emit('signin'); open = false;"
            >
              Sign in
            </button>

            <button
              v-if="!isAuthed"
              type="button"
              class="nav-cta nav-cta--accent"
              @click.stop.prevent="$emit('signup'); open = false;"
            >
              Sign up
            </button>

            <button
              v-else
              type="button"
              class="col-span-2 nav-cta"
              @click.stop.prevent="$emit('logout'); open = false;"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const emit = defineEmits<{
  (e: "signin"): void;
  (e: "signup"): void;
  (e: "logout"): void;
}>();

const open = ref(false);
const supportsBackdrop = ref(false);

const { isAuthed, user } = useAuth();
const router = useRouter();

const userMenu = ref(false);

const email = computed(() => user.value?.email ?? "");
const usernameMeta = computed(
  () =>
    (user.value?.user_metadata?.username ||
      user.value?.user_metadata?.desired_username ||
      "") as string
);
const unreadCount = ref(0);
const isAdmin = computed(() => user.value?.app_metadata?.role === "admin");

const displayLabel = computed(
  () =>
    usernameMeta.value || (email.value ? email.value.split("@")[0] : "Account")
);
const avatarInitial = computed(() =>
  (displayLabel.value[0] || "U").toUpperCase()
);

function linkClass(active: boolean) {
  return [
    "relative transition-colors",
    active ? "text-white" : "text-white/80 hover:text-white",
  ];
}

function onSignin() {
  emit("signin");
  open.value = false;
}
function onSignup() {
  emit("signup");
  open.value = false;
}
function onLogout() {
  emit("logout");
  userMenu.value = false;
  open.value = false;
}

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest(".usermenu-root")) userMenu.value = false;
}

onMounted(() => {
  supportsBackdrop.value = !!(
    window.CSS &&
    CSS.supports &&
    CSS.supports("backdrop-filter: blur(10px)")
  );
  document.addEventListener("click", onDocClick);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
});
</script>

<style scoped>
.site-header{
  backdrop-filter: blur(10px) saturate(1.2);
  -webkit-backdrop-filter: blur(10px) saturate(1.2);
  background:
    radial-gradient(120% 120% at 10% -20%, rgba(160,190,255,.10), rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(18,20,26,.86), rgba(12,14,18,.86));
  border-bottom: 1px solid rgba(255,255,255,.06);
  box-shadow: 0 10px 26px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);
}
.accent-line{
  height: 2px;
  width: 100%;
  background: linear-gradient(90deg, rgba(110,200,255,.0), rgba(110,200,255,.65), rgba(160,120,255,.0));
  filter: drop-shadow(0 0 6px rgba(120,200,255,.35));
  opacity: .65;
}
.nav-cta{
  @apply text-sm;
  border: 1px solid rgba(255,255,255,.14);
  color: rgba(255,255,255,.92);
  padding: .4rem .75rem;
  border-radius: 9999px;
  background:
    radial-gradient(100% 80% at 20% -20%, rgba(255,255,255,.12) 0, rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease, transform .12s ease;
}
.nav-cta:hover{ border-color: rgba(255,255,255,.22); box-shadow: 0 6px 18px rgba(0,0,0,.35); transform: translateY(-1px); }
.nav-cta:active{ transform: translateY(0); }
.nav-cta--accent{
  border-color: rgba(160,120,255,.4);
  background:
    radial-gradient(100% 80% at 20% -20%, rgba(160,120,255,.20) 0, rgba(160,120,255,0) 60%),
    linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
  box-shadow: 0 4px 14px rgba(160,120,255,.18);
}
.user-pill{
  display:flex; align-items:center; gap:.5rem;
  border:1px solid rgba(255,255,255,.14);
  color: rgba(255,255,255,.92);
  padding:.35rem .6rem; border-radius:9999px;
  background:
    radial-gradient(100% 80% at 20% -20%, rgba(255,255,255,.12) 0, rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
}
.avatar-dot{
  width:22px; height:22px; border-radius:9999px;
  display:grid; place-items:center;
  font-weight:700; font-size:.8rem;
  background: linear-gradient(180deg, rgba(160,120,255,.35), rgba(110,200,255,.25));
  border:1px solid rgba(255,255,255,.18);
}
.user-label{ font-size:.875rem; opacity:.9; }
.user-menu{
  position:absolute; right:0; margin-top:.5rem; min-width:220px;
  border:1px solid rgba(255,255,255,.12);
  border-radius:12px;
  background:
    radial-gradient(120% 120% at 10% -20%, rgba(160,190,255,.10), rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(18,20,26,.96), rgba(12,14,18,.96));
  box-shadow: 0 12px 36px rgba(0,0,0,.45);
  overflow:hidden;
  display:flex; flex-direction:column;
}
.user-item{
  width:100%; text-align:left; padding:.6rem .75rem;
  color:rgba(255,255,255,.92);
  display:flex; align-items:center; gap:.5rem;
}
.user-item:hover{ background: rgba(255,255,255,.06); }
.user-item.danger{ color:#ffb4b4; }
.user-item.danger:hover{ background: rgba(255,80,80,.12); }
.user-item .ico{ width:18px; height:18px; display:inline-grid; place-items:center; opacity:.9; }
.burger{ color: rgba(255,255,255,.9); }
.fade-enter-active,.fade-leave-active{ transition: opacity .18s ease; }
.fade-enter-from,.fade-leave-to{ opacity: 0; }
.drawer{
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 14px;
  background:
    radial-gradient(120% 120% at 10% -20%, rgba(160,190,255,.10), rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(18,20,26,.92), rgba(12,14,18,.92));
  box-shadow: 0 12px 36px rgba(0,0,0,.45);
  padding: .75rem;
}
.drawer a{ width:100%; }
.drawer-link{
  display: block;
  padding: .625rem .5rem;
  color: rgba(255,255,255,.9);
  border-radius: .6rem;
}
.drawer-link:hover{ background: rgba(255,255,255,.06); }
.site-header:not(.backdrop-supported){ background: rgba(12,14,18,.96); }
</style>
