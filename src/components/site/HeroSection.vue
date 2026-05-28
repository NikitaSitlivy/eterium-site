<template>
  <section class="hero-section home-shell">
    <CyberPanel tone="strong" class="hero-frame hero-panel">
      <div class="hero-stage" aria-hidden="true">
        <img
          v-if="showHeroImage"
          class="hero-stage__image"
          :src="heroPortal"
          alt=""
          width="1122"
          height="1402"
          fetchpriority="high"
          decoding="async"
          @error="showHeroImage = false"
        />
        <div class="hero-stage__overlay"></div>
        <div class="hero-stage__scan"></div>
        <div class="hero-stage__vignette"></div>
      </div>

      <div class="hero-grid">
        <div class="hero-copy hero-content">
          <div class="eyebrow-badge">BROWSER-NATIVE AAA</div>
          <h1 class="hero-title">
            <span>AGASSU -</span>
            <span>horror roguelike</span>
            <span>that runs <em>instantly</em></span>
            <span>in your browser</span>
          </h1>
          <p class="hero-subtitle">
            No installs. Squad up in seconds.
            <br />
            WebGPU visuals, console-grade feel
            <br />
            - click and play.
          </p>
          <div class="hero-actions">
            <RouterLink class="btn btn-primary btn-hero" to="/games/agassu">Enter the Portal</RouterLink>
            <a class="btn btn-secondary btn-hero" href="#why">Play Instantly</a>
          </div>
          <div class="hero-chips">
            <FeatureChip
              v-for="chip in chips"
              :key="chip.label"
              :label="chip.label"
              :icon="chip.icon"
              :tone="chip.tone"
            />
          </div>
        </div>
      </div>
    </CyberPanel>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import CyberPanel from './CyberPanel.vue'
import FeatureChip from './FeatureChip.vue'

const showHeroImage = ref(true)
const heroPortal = '/media/hero/agassu-hero-lcp.jpg'

const chips = [
  { label: 'Instant startup', icon: 'bolt', tone: 'pink' },
  { label: 'Zero installs', icon: 'hex', tone: 'default' },
  { label: 'WebGPU powered', icon: 'gpu', tone: 'cyan' },
  { label: 'Cross-device', icon: 'grid', tone: 'default' }
] as const
</script>
