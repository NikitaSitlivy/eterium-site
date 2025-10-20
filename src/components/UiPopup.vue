<template>
  <Transition name="modal-fade" appear>
    <div v-if="open" class="fixed inset-0 z-40 grid place-items-center bg-black/60">
      <div class="card w-[92vw] max-w-md p-6 md:p-8 relative text-center">
        <button
          v-if="closable"
          class="absolute right-3 top-3 text-white/60 hover:text-white"
          @click="$emit('close')"
        >
          ✕
        </button>

        <h2 v-if="title" class="text-xl font-semibold mb-3">{{ title }}</h2>
        <p v-if="message" class="text-white/70 mb-6" v-html="message"></p>

        <button v-if="buttonLabel" class="cta w-full" @click="$emit('close')">
          {{ buttonLabel }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  title?: string
  message?: string
  buttonLabel?: string
  closable?: boolean
}>()
defineEmits<{ (e: 'close'): void }>()
</script>
