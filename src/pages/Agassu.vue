<template>
<main id="main-content" class="agassu-site">
<GameShowcase /><GameLocations />
<section id="development" class="game-section development-section"><div><span class="section-code">AGASSU / BUILD 0.2</span><h2>Through<br /><em>the looking glass.</em></h2><p>AGASSU is a third-person browser horror game in development. The current local build includes THE BASIN, the station anomaly, a weather hall, combat experiments and an open-world prototype.</p><p>Explore the pool and portal in the interactive scene above. This is a presentation of the world; the game itself runs separately.</p></div><div class="build-spec"><div><span>VERSION</span><strong>0.2 / DEVELOPMENT</strong></div><div><span>GRAPHICS</span><strong>3D / PBR / WebGL</strong></div><div><span>PERSPECTIVE</span><strong>Third person</strong></div><div><span>STATUS</span><strong>In development</strong></div></div></section>
<section class="game-section game-questions"><span class="section-code">BEFORE YOU ENTER</span><h2>A few things to know.</h2><details><summary>Can I explore the scene?</summary><p>Yes. Select the pool or portal, move your cursor or drag to change the view. Switch between rain, thunderstorms and snow. The portal uses models and its energy shader from AGASSU; the pool is a dedicated environment built for this website.</p></details><details><summary>Where can I play the game?</summary><p>The game is currently a separate development project. A public playable build is not linked here yet.</p></details><details><summary>Can I reduce the graphics?</summary><p>Select light quality or pause motion using the scene controls. Rendering pauses automatically when the scene leaves the screen.</p></details></section>
<AppFooter />
</main>
</template>
<script setup lang="ts">
import GameShowcase from '../components/site/GameShowcase.vue'
import GameLocations from '../components/site/GameLocations.vue'
import AppFooter from '../components/site/AppFooter.vue'
</script>
