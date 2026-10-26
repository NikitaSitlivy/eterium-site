<template>
<footer class="editorial-footer">
<div class="footer-top"><RouterLink to="/" class="editorial-wordmark">AGASSU</RouterLink><nav aria-label="Footer navigation"><RouterLink to="/#locations">World</RouterLink><RouterLink to="/#experience">Experience</RouterLink><RouterLink to="/#development">Development</RouterLink></nav><span class="studio-wordmark">ETERIUM</span></div>
<div class="footer-taglines"><span>A game by Eterium</span><span>Some places shouldn't exist.</span></div>
<div class="footer-bottom"><small>© 2026 Eterium. All rights reserved.</small><nav aria-label="Legal and support"><RouterLink to="/privacy">Privacy</RouterLink><RouterLink to="/legal">Legal</RouterLink><RouterLink to="/support">Support</RouterLink></nav></div>
</footer>
</template>
<script setup lang="ts">
import {RouterLink} from 'vue-router'
</script>
