<template>
  <Transition name="modal-fade" appear>
    <div v-if="open" class="fixed inset-0 z-40 grid place-items-center bg-black/60">
      <div class="card w-[92vw] max-w-md p-6 md:p-8 relative text-center">
        <button class="absolute right-3 top-3 text-white/60 hover:text-white" @click="$emit('close')">✕</button>
        <h2 class="text-xl font-semibold mb-3">Check your email</h2>
        <p class="text-white/70 mb-6">
          We've sent a confirmation link to <b>{{ email }}</b>.<br />
          Please confirm your account and then sign in.
        </p>
        <button class="cta w-full" @click="$emit('close')">OK</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ open: boolean; email: string }>()
defineEmits<{ (e: 'close'): void }>()
</script>
