<template>
  <div class="feature-chip" :class="[`feature-chip--${tone}`]">
    <span class="feature-chip__icon" aria-hidden="true">
      <svg viewBox="0 0 20 20">
        <path :d="iconPath" />
      </svg>
    </span>
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  icon?: 'bolt' | 'hex' | 'gpu' | 'grid' | 'spark' | 'orbit'
  tone?: 'default' | 'pink' | 'cyan'
}>(), {
  icon: 'hex',
  tone: 'default'
})

const iconPath = computed(() => {
  switch (props.icon) {
    case 'bolt':
      return 'M10.8 1.5 4.7 10h3.6L7.9 18.5l7.4-9.4h-3.6l-.9-7.6Z'
    case 'gpu':
      return 'M3.5 5.5h13v9h-13Zm2 2v5m7-5v5M1.5 8.5h2m13 0h2m-14 6h11'
    case 'grid':
      return 'M3 3.5h5v5H3Zm9 0h5v5h-5ZM3 12h5v5H3Zm9 0h5v5h-5Z'
    case 'spark':
      return 'M10 2.5 11.9 7 16.5 8.9 11.9 10.8 10 15.5 8.1 10.8 3.5 8.9 8.1 7Z'
    case 'orbit':
      return 'M10 3a7 7 0 1 0 7 7M4.2 5.7c1.5 1 3.6 1.6 5.8 1.6 2.3 0 4.4-.6 5.9-1.6M4.2 14.3c1.5-1 3.6-1.6 5.8-1.6 2.3 0 4.4.6 5.9 1.6'
    default:
      return 'M10 1.8 16.4 5.4v9.2L10 18.2 3.6 14.6V5.4Z'
  }
})
</script>
