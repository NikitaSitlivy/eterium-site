<template>
  <section
    :class="[
      'cyber-panel',
      `cyber-panel--${tone}`,
      { 'cyber-panel--interactive': interactive }
    ]"
  >
    <div v-if="$slots.top" class="cyber-panel__top">
      <slot name="top" />
    </div>
    <div class="cyber-panel__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  tone?: 'default' | 'accent' | 'strong'
  interactive?: boolean
}>(), {
  tone: 'default',
  interactive: false
})
</script>
