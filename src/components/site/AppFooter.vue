<template>
  <footer class="app-footer home-shell">
    <div class="app-footer__inner">
      <RouterLink class="brand-mark brand-mark--footer" to="/" aria-label="Eterium home">
        <span class="brand-mark__badge">
          <img class="brand-mark__logo-icon" src="/media/logo.png" alt="" />
        </span>
        <span class="brand-mark__meta">В© 2026 Eterium</span>
      </RouterLink>

      <nav class="app-footer__nav" aria-label="Footer navigation">
        <a href="#why">Why</a>
        <a href="#support">Support</a>
        <RouterLink to="/legal">Legal</RouterLink>
        <RouterLink to="/privacy">Privacy</RouterLink>
      </nav>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
