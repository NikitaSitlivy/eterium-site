<template>
<main id="main-content" class="agassu-site">
<section class="game-section development-section"><div><span class="section-code">ETERIUM / SUPPORT THE PROJECT</span><h2>Help this world<br /><em>grow stranger.</em></h2><p>AGASSU is taking shape. Explore the game and share it with someone who loves strange worlds, horror and immersive 3D experiences.</p><div class="scene-actions"><button class="scene-primary" @click="copyLink">{{ copied ? 'Link copied' : 'Copy link' }} ↗</button><RouterLink class="scene-secondary" to="/games/agassu">Explore AGASSU</RouterLink></div><p role="status">{{ message }}</p></div><div class="build-spec"><div><span>PROJECT</span><strong>AGASSU / ETERIUM</strong></div><div><span>BUILD</span><strong>0.2 / in development</strong></div><div><span>PAID SUPPORT</span><strong>Not open yet</strong></div><p>Support options and rewards will be announced when available.</p></div></section>
<AppFooter />
</main>
</template>
<script setup lang="ts">
import {ref} from 'vue'
import {RouterLink} from 'vue-router'
import AppFooter from '../components/site/AppFooter.vue'
const copied=ref(false),message=ref('')
async function copyLink(){
const url=new URL('/games/agassu',location.origin).href
try{await navigator.clipboard.writeText(url);copied.value=true;message.value='Copied. Share the link with your friends.'}catch{message.value=url}
}
</script>
