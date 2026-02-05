<template>
  <div
    class="dropzone"
    :class="{ dragging: isOver, disabled }"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="dz-inner">
      <!-- Новая иконка: облако со стрелкой вверх -->
      <svg class="dz-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 18a4 4 0 1 1 1.2-7.83A5 5 0 0 1 18 11h.5A3.5 3.5 0 1 1 18 18H7Z"
          fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
        />
        <path
          d="M12 7v8m0-8l-3 3m3-3l3 3"
          fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
        />
      </svg>

      <div class="dz-title">Drag & Drop image here</div>
      <div class="dz-sub">or</div>

      <button
        type="button"
        class="nav-cta mt-2"
        :disabled="disabled"
        @click="openPicker"
      >
        Choose file
      </button>

      <div v-if="note" class="dz-note">{{ note }}</div>
    </div>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :accept="accept"
      @change="onChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  disabled?: boolean
  accept?: string
  note?: string
}>(), {
  disabled: false,
  accept: 'image/*',
  note: ''
})

const emit = defineEmits<{
  (e: 'file', file: File): void
}>()

const isOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function onDragOver() {
  if (props.disabled) return
  isOver.value = true
}
function onDragLeave() {
  isOver.value = false
}
function onDrop(ev: DragEvent) {
  isOver.value = false
  if (props.disabled) return
  const f = ev.dataTransfer?.files?.[0]
  if (f) emit('file', f)
}
function openPicker() {
  if (props.disabled) return
  fileInput.value?.click()
}
function onChange(ev: Event) {
  const f = (ev.target as HTMLInputElement).files?.[0]
  if (f) emit('file', f)
  ;(ev.target as HTMLInputElement).value = ''
}
</script>

<style scoped>
.dropzone{
  border: 1px dashed rgba(255,255,255,.22);
  border-radius: 14px;
  padding: 22px;
  background: rgba(255,255,255,.02);
  transition: all .15s ease;
}
.dropzone.dragging{
  background: rgba(160,120,255,.10);
  border-color: rgba(160,120,255,.45);
  box-shadow: 0 0 0 3px rgba(160,120,255,.15) inset;
}
.dropzone.disabled{ opacity: .6; pointer-events: none; }

.dz-inner{ text-align:center; color: rgba(255,255,255,.86); }
.dz-icon{
  width: 34px; height: 34px;
  opacity: .88; margin: 2px auto 6px;
}
.dz-title{ font-weight: 600; margin-top: .15rem; }
.dz-sub{ font-size: .9rem; opacity:.8; }
.dz-note{ font-size: .8rem; opacity:.6; margin-top: .45rem; }
</style>
