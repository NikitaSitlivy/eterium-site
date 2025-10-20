
<template>
  <div v-if="overlay" v-show="open" class="fixed inset-0 z-50 grid place-items-center bg-black/40">
    <div class="flex flex-col items-center gap-3">
      <div class="spinner" :style="sizeStyle"></div>
      <div v-if="label" class="text-white/80 text-sm">{{ label }}</div>
    </div>
  </div>
  <div v-else class="inline-flex items-center gap-2">
    <div class="spinner" :style="sizeStyle"></div>
    <span v-if="label" class="text-white/70 text-sm">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  open?: boolean
  overlay?: boolean
  size?: 'sm'|'md'|'lg'|number
  label?: string
}>()

const sizeStyle = computed(() => {
  const map: Record<string, number> = { sm: 18, md: 26, lg: 38 }
  const px = typeof props.size === 'number' ? props.size : map[props.size ?? 'md']
  return { width: `${px}px`, height: `${px}px` }
})
</script>

<style scoped>
@keyframes spin{ to{ transform: rotate(360deg) } }
.spinner{
  border-radius: 9999px;
  border: 3px solid rgba(255,255,255,.18);
  border-top-color: rgba(160,120,255,.95);
  animation: spin .8s linear infinite;
  box-shadow: 0 0 20px rgba(150,130,255,.15), inset 0 0 6px rgba(255,255,255,.05);
}
</style>
