<template>
  <footer class="app-footer home-shell">
    <div class="app-footer__inner">
      <RouterLink class="brand-mark brand-mark--footer" to="/" aria-label="Eterium home">
        <span class="brand-mark__badge">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M24 3.5 41 13.2v21.6L24 44.5 7 34.8V13.2Z" />
            <path d="M31.5 15.2H18.2v5.1H28v4.4h-9.8V30h13.3v5.2H12.5V10h19Z" />
          </svg>
        </span>
        <span class="brand-mark__meta">© 2026 Eterium</span>
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
