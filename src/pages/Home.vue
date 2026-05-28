<template>
  <div class="home-page">
    <div class="home-shell-frame">
      <HeroSection />

      <section id="why" class="home-section">
        <div class="section-grid two-col top-panels">
          <CyberPanel tone="default" class="panel-pad why-panel">
            <div class="eyebrow section-label">Why</div>
            <h2 class="section-title">
              <span class="title-nowrap">Browser-Native</span>
              <br />
              Is the Future
            </h2>
            <p class="section-copy">
              WebGPU and modern WebGL unlock console-grade visuals on the web - with instant startup,
              cross-device by design. No launchers. No drivers. Just click and play.
            </p>
            <div class="stats-grid">
              <div v-for="stat in stats" :key="stat.label" class="stat-cell">
                <FeatureChip :label="stat.label" :icon="stat.icon" :tone="stat.tone" />
              </div>
            </div>
          </CyberPanel>

          <CyberPanel tone="accent" interactive class="panel-pad players-panel">
            <h3 class="panel-title">What It Means for Players</h3>
            <div class="info-list">
              <div v-for="item in playerBenefits" :key="item" class="info-list__item">
                <span class="info-list__icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20">
                    <path d="M10 2.5 15.8 5.7v8.6L10 17.5l-5.8-3.2V5.7Z" />
                    <path d="m7.2 10.2 1.8 1.8 3.8-4.2" />
                  </svg>
                </span>
                <span>{{ item }}</span>
              </div>
            </div>
          </CyberPanel>
        </div>
      </section>

      <section id="development" class="home-section">
        <div class="section-grid split-col">
          <CyberPanel tone="accent" interactive class="panel-pad development-panel">
            <div class="eyebrow section-label">Agassu</div>
            <h2 class="card-heading">
              In Development
            </h2>
            <p class="section-copy">
              A third-person co-op roguelike horror with dynamic progression between sessions.
              Procedural tension. Team up to survive and evolve your build run after run.
            </p>
            <div class="status-line">Status: Pro-Demo (Coming Soon)</div>
            <div class="button-row">
              <RouterLink class="btn btn-primary" to="/games/agassu">View Game Page</RouterLink>
              <a class="btn btn-secondary" href="#support">Follow Devlogs</a>
            </div>
          </CyberPanel>

          <CyberPanel tone="strong" class="media-card image-panel">
            <div class="media-stack">
              <picture v-if="showEnergyImage">
                <img
                  :src="energyRiftImage"
                  alt="Energy Rift preview"
                  loading="lazy"
                  decoding="async"
                  @error="showEnergyImage = false"
                />
              </picture>
              <EnergyOrb v-else quality="medium" />
              <p class="caption">
                Energy Rift preview. Final in-game portal VFX will be integrated during production.
              </p>
            </div>
          </CyberPanel>
        </div>
      </section>

      <section id="support" class="home-section">
        <div class="support-layout">
          <CyberPanel tone="default" interactive class="panel-pad support-panel">
            <div class="section-image-bg section-image-bg--support" aria-hidden="true"></div>
            <div class="eyebrow section-label">Support</div>
            <h2 class="card-heading">
              Support
              <br />
              The Project
            </h2>
            <p class="section-copy">
              Eterium is for everyone - play and socialize right in the browser, regardless of your
              PC. We are building a universe of games that launch instantly and bring people together.
            </p>
            <ul class="bullet-list">
              <li>Founded based on your profile (future).</li>
              <li>Early access to demos and playtests.</li>
              <li>Exclusive profile backgrounds and cosmetics.</li>
            </ul>
            <div class="button-row">
              <RouterLink class="btn btn-primary" to="/support">Become a Backer</RouterLink>
              <a class="btn btn-secondary" href="#prologue">See Future Rewards</a>
            </div>
          </CyberPanel>

          <CyberPanel tone="accent" interactive class="panel-pad support-way-panel">
            <h3 class="panel-title">Choose Your Way</h3>
            <div class="support-options">
              <div v-for="option in supportOptions" :key="option.title" class="support-option">
                <span class="support-option__icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20">
                    <path d="M10 2.5 15.8 5.7v8.6L10 17.5l-5.8-3.2V5.7Z" />
                    <path d="M6.5 10h7M10 6.5v7" />
                  </svg>
                </span>
                <div class="support-option__copy">
                  <strong>{{ option.title }}</strong>
                  <span>{{ option.copy }}</span>
                </div>
              </div>
            </div>
            <p class="support-caption">Secure payments via Stripe or Ko-fi.</p>
          </CyberPanel>
        </div>
      </section>

      <section id="prologue" class="home-section prologue-cta">
        <CyberPanel tone="strong" class="prologue-cta__panel">
          <div class="prologue-cta__media" aria-hidden="true">
            <picture v-if="showPrologueImage">
              <img
                :src="prologueRiftImage"
                alt=""
                loading="lazy"
                decoding="async"
                @error="showPrologueImage = false"
              />
            </picture>
          </div>

          <div class="prologue-cta__content">
            <div>
              <h2 class="cta-title">Play the Prologue</h2>
              <p class="cta-copy">
                Enter the First Rift and test a fast AGASSU vertical slice right in the browser.
              </p>
              <RouterLink class="btn btn-primary cta-button" to="/games/agassu">
                Enter the First Rift →
              </RouterLink>
            </div>
          </div>
        </CyberPanel>
      </section>

      <AppFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppFooter from '../components/site/AppFooter.vue'
import CyberPanel from '../components/site/CyberPanel.vue'
import FeatureChip from '../components/site/FeatureChip.vue'
import HeroSection from '../components/site/HeroSection.vue'
const EnergyOrb = defineAsyncComponent(() => import('../components/site/EnergyOrb.vue'))
const showEnergyImage = ref(true)
const showPrologueImage = ref(true)
const energyRiftImage = encodeURI('/media/magic-ball/ChatGPT Image 26 апр. 2026 г., 10_42_15.png')
const prologueRiftImage = encodeURI('/media/ChatGPT Image 26 апр. 2026 г., 10_46_06.png')

const stats = [
  { label: 'Instant startup', icon: 'bolt', tone: 'pink' },
  { label: 'No installs', icon: 'hex', tone: 'default' },
  { label: 'Cross-platform', icon: 'grid', tone: 'default' },
  { label: 'GPU-powered', icon: 'gpu', tone: 'cyan' }
] as const

const playerBenefits = [
  'Join friends in seconds with zero friction.',
  'Smooth visuals powered by your GPU.',
  'Play anywhere: desktop, laptop, and lower-end machines.',
  'Social features baked in: parties, chat, profiles.'
]

const supportOptions = [
  { title: 'One-time donation', copy: 'Pay what you want' },
  { title: 'Monthly backer', copy: 'Support ongoing production' },
  { title: 'Tip jar', copy: 'Drop a quick boost into the Rift' }
]
</script>
