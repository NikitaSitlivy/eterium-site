<template>
  <div class="notice">
    <svg viewBox="0 0 24 24" class="ico"><path d="M12 9v4m0 4h.01M12 3l9 18H3L12 3z"/></svg>
    <div class="txt">
      Upload only images that comply with our rules.
      No nudity, pornography, sexual content, violence, or illegal material.
      <RouterLink to="/legal#content-policy" class="link">Read policy</RouterLink>.
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.notice{
  display:flex; gap:.6rem; align-items:flex-start;
  padding:.6rem .8rem; border-radius:12px;
  border:1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.92);
  font-size: 13px;
}
.ico{ width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.6; margin-top:.1rem; opacity:.9; }
.link{ color:#cfe0ff; text-decoration: underline dotted; }
.link:hover{ color:#fff; }
</style>
