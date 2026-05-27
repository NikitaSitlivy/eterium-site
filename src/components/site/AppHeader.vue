<template>
  <header class="app-header">
    <div class="app-header__bar home-shell">
      <RouterLink class="brand-mark" to="/" aria-label="Eterium home">
        <img class="brand-mark__logo" src="/media/logo.png" alt="Eterium" />
      </RouterLink>

      <nav class="app-header__nav" aria-label="Primary navigation">
        <a v-for="item in navItems" :key="item.href" :href="item.href">{{ item.label }}</a>
      </nav>

      <div class="app-header__actions">
        <template v-if="isAuthed">
          <RouterLink class="btn btn-ghost" to="/account">Account</RouterLink>
          <button class="btn btn-secondary" type="button" @click="handleSignOut">Sign out</button>
        </template>
        <template v-else>
          <RouterLink class="btn btn-ghost" to="/login">Sign in</RouterLink>
          <RouterLink class="btn btn-primary" to="/login?mode=signup">Sign up</RouterLink>
        </template>
      </div>

      <button
        class="app-header__menu-btn"
        type="button"
        :aria-expanded="menuOpen"
        aria-label="Toggle menu"
        @click="menuOpen = !menuOpen"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <transition name="home-fade">
      <div v-if="menuOpen" class="app-header__drawer home-shell">
        <nav class="app-header__drawer-nav" aria-label="Mobile navigation">
          <a v-for="item in navItems" :key="`${item.href}-mobile`" :href="item.href" @click="menuOpen = false">
            {{ item.label }}
          </a>
        </nav>
        <div class="app-header__drawer-actions">
          <template v-if="isAuthed">
            <RouterLink class="btn btn-ghost" to="/account" @click="menuOpen = false">Account</RouterLink>
            <button class="btn btn-secondary" type="button" @click="handleSignOut">Sign out</button>
          </template>
          <template v-else>
            <RouterLink class="btn btn-ghost" to="/login" @click="menuOpen = false">Sign in</RouterLink>
            <RouterLink class="btn btn-primary" to="/login?mode=signup" @click="menuOpen = false">Sign up</RouterLink>
          </template>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const navItems = [
  { label: 'Games', href: '#development' },
  { label: 'Community', href: '#why' },
  { label: 'Devlog', href: '#development' },
  { label: 'Support', href: '#support' }
]

const router = useRouter()
const { isAuthed, signOut } = useAuth()
const menuOpen = ref(false)

async function handleSignOut() {
  menuOpen.value = false
  await signOut()
  await router.push('/')
}
</script>
