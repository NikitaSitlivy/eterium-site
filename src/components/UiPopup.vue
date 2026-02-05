<template>
  <Transition name="modal-fade" appear>
    <div v-if="open" class="fixed inset-0 z-40 grid place-items-center bg-black/60">
      <div :class="['popup-card', variantClass]">
        <button
          v-if="closable"
          class="absolute right-3 top-3 text-white/60 hover:text-white"
          @click="$emit('close')"
          aria-label="Close"
        >✕</button>

        <div class="flex items-start gap-3">
          <div class="ico-wrap" :class="icoWrapClass">
            <!-- Иконка по варианту -->
            <svg v-if="variant === 'danger'" viewBox="0 0 24 24" class="ico">
              <path d="M12 9v4m0 4h.01M10.29 3.86l-8.4 14.57A2 2 0 0 0 3.73 22h16.54a2 2 0 0 0 1.84-3.57L13.7 3.86a2 2 0 0 0-3.42 0Z"/>
            </svg>
            <svg v-else-if="variant === 'warning'" viewBox="0 0 24 24" class="ico">
              <path d="M12 8v4m0 4h.01M4 20h16L12 4 4 20Z"/>
            </svg>
            <svg v-else-if="variant === 'success'" viewBox="0 0 24 24" class="ico">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" class="ico">
              <path d="M12 5a7 7 0 1 0 7 7 7 7 0 0 0-7-7Z"/>
            </svg>
          </div>

          <div class="flex-1">
            <h2 v-if="title" class="title">{{ title }}</h2>
            <p v-if="message" class="msg" v-html="message"></p>

            <div class="mt-6">
              <button
                v-if="buttonLabel"
                class="cta w-full"
                @click="$emit('close')"
              >
                {{ buttonLabel }}
              </button>

              <div v-else class="mt-1">
                <button class="nav-cta w-full" @click="$emit('close')">OK</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  open: boolean
  title?: string
  message?: string
  buttonLabel?: string
  closable?: boolean
  variant?: 'default' | 'success' | 'warning' | 'danger'
}>()

defineEmits<{ (e: 'close'): void }>()

const variantClass = computed(() => {
  switch (props.variant) {
    case 'danger':  return 'popup-danger'
    case 'warning': return 'popup-warning'
    case 'success': return 'popup-success'
    default:        return 'popup-default'
  }
})
const icoWrapClass = computed(() => {
  switch (props.variant) {
    case 'danger':  return 'ico-danger'
    case 'warning': return 'ico-warning'
    case 'success': return 'ico-success'
    default:        return 'ico-default'
  }
})
</script>

<style scoped>
.popup-card{
  @apply relative w-[92vw] max-w-md p-6 md:p-8 rounded-2xl text-left;
  border: 1px solid rgba(255,255,255,.10);
  background:
    radial-gradient(120% 120% at 10% -20%, rgba(160,190,255,.10), rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(18,20,26,.96), rgba(12,14,18,.96));
  box-shadow: 0 18px 48px rgba(0,0,0,.55);
}
.title{ @apply text-xl font-semibold mb-2; }
.msg{ @apply text-white/80 leading-relaxed; }
.ico{ width:22px; height:22px; fill:none; stroke:currentColor; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
.ico-wrap{
  @apply shrink-0 grid place-items-center w-9 h-9 rounded-lg border;
  background: rgba(255,255,255,.05);
  border-color: rgba(255,255,255,.14);
}
.ico-default{ color: #cde1ff; }
.ico-success{ color: #8be39b; border-color: rgba(120,230,150,.35); background: rgba(120,230,150,.10); }
.ico-warning{ color: #ffd27a; border-color: rgba(255,210,120,.35); background: rgba(255,210,120,.10); }
.ico-danger{ color: #ff9c9c; border-color: rgba(255,120,120,.35); background: rgba(255,120,120,.10); }

/* variant borders/glow */
.popup-danger{ box-shadow: 0 18px 48px rgba(0,0,0,.55), 0 0 0 1px rgba(255,120,120,.25) inset; }
.popup-warning{ box-shadow: 0 18px 48px rgba(0,0,0,.55), 0 0 0 1px rgba(255,210,120,.22) inset; }
.popup-success{ box-shadow: 0 18px 48px rgba(0,0,0,.55), 0 0 0 1px rgba(120,230,150,.22) inset; }
.popup-default{}

/* transition same as раньше */
.modal-fade-enter-active,.modal-fade-leave-active{ transition: opacity .18s ease; }
.modal-fade-enter-from,.modal-fade-leave-to{ opacity: 0; }
</style>
