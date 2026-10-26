<template>
<main ref="page" id="main-content" class="agassu-site reference-site">
<GameShowcase ref="showcase" />
<section class="manifesto">
<h2>Beautifully<br />familiar.</h2>
<p class="manifesto-note"><i></i>The unfamiliar<br />lives in<br />plain sight.</p>
<p class="manifesto-copy"><i></i>Ordinary spaces.<br />Extraordinary unease.<br />AGASSU is a third-person liminal horror exploration game set in places that feel real,<br />but aren't quite right.</p>
<img src="/media/game/station.webp" alt="An unsettling room in AGASSU" width="1280" height="720" loading="lazy" />
<h2 class="manifesto-end">Deeply wrong.</h2>
</section>
<GameLocations />
<section id="experience" class="core-experience">
<div class="editorial-label"><b>03</b><span>Core experience</span><i></i></div>
<div class="core-list"><article><i></i><div><h3>Explore</h3><p>Vast, interconnected spaces<br />that reward curiosity.</p></div></article><article><i></i><div><h3>Observe</h3><p>Find meaning in the subtle,<br />the displaced, the unexpected.</p></div></article><article><i></i><div><h3>Uncover</h3><p>Piece together a world<br />that shouldn't exist.</p></div></article></div>
<span class="core-number" aria-hidden="true">03</span>
<img src="/media/game/entity.webp" alt="A character confronts the unknown in AGASSU" width="1280" height="720" loading="lazy" />
<p class="core-aside">Same<br />spaces.<br />Different<br />questions.<i></i></p>
</section>
<section id="development" class="editorial-development">
<div class="editorial-label"><b>—</b><span>Development</span><small>A more uneasy tomorrow.</small></div>
<div class="development-grid">
<article><img src="/media/game/weather.webp" alt="AGASSU weather hall" width="1280" height="720" loading="lazy" /><h3>World</h3><h4>Real spaces. Altered perspective.</h4><p>Built from familiar places.<br />Reimagined into something else.</p></article>
<article><img src="/media/game/station.webp" alt="Light and shadow around the portal" width="1280" height="720" loading="lazy" /><h3>Atmosphere</h3><h4>Tension in the ordinary.</h4><p>Lighting and space work together<br />to create a constant sense of unease.</p></article>
<article><img src="/media/game/exterior.webp" alt="AGASSU's experimental exterior world" width="1280" height="800" loading="lazy" /><h3>Development</h3><h4>A world in progress.</h4><p>Built by Eterium.<br />AGASSU continues to evolve.</p></article>
</div>
</section>
<section class="threshold"><img src="/media/game/basin.webp" alt="" width="1280" height="720" loading="lazy" /><h2>Cross the<br />threshold.</h2><button @click="showcase?.enter('portal')">Enter AGASSU <span>⟶</span></button><p>Familiar<br />places.<br />A different<br />reality.</p></section>
<AppFooter />
</main>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useEditorialMotion } from '../composables/useEditorialMotion'
import GameShowcase from '../components/site/GameShowcase.vue'
import GameLocations from '../components/site/GameLocations.vue'
import AppFooter from '../components/site/AppFooter.vue'
const showcase=ref<InstanceType<typeof GameShowcase>|null>(null)
const page=ref<HTMLElement|null>(null)
useEditorialMotion(page)
</script>
