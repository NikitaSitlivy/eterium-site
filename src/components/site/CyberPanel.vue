<template>
  <section
    :class="[
      'cyber-panel',
      `cyber-panel--${tone}`,
      { 'cyber-panel--interactive': interactive }
    ]"
  >
    <div class="cyber-panel__grid" aria-hidden="true"></div>
    <div class="cyber-panel__noise" aria-hidden="true"></div>
    <div class="cyber-panel__frame" aria-hidden="true"></div>
    <div class="cyber-panel__inner-line" aria-hidden="true"></div>

    <span class="cyber-panel__corner cyber-panel__corner--tl"></span>
    <span class="cyber-panel__corner cyber-panel__corner--tr"></span>
    <span class="cyber-panel__corner cyber-panel__corner--bl"></span>
    <span class="cyber-panel__corner cyber-panel__corner--br"></span>

    <span class="cyber-panel__edge cyber-panel__edge--top" aria-hidden="true"></span>
    <span class="cyber-panel__edge cyber-panel__edge--right" aria-hidden="true"></span>
    <span class="cyber-panel__edge cyber-panel__edge--bottom" aria-hidden="true"></span>
    <span class="cyber-panel__edge cyber-panel__edge--left" aria-hidden="true"></span>

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
