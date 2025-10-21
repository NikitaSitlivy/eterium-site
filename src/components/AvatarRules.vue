<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e:'update:modelValue', v:boolean): void }>()
function toggle(){ emit('update:modelValue', !props.modelValue) }
</script>

<template>
  <div class="ar-card">
    <div class="ar-row">
      <div class="ar-left">
        <svg class="ar-ico" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M12 3l9 18H3L12 3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="ar-text">
          <div class="ar-title">Follow our Content Policy</div>
          <div class="ar-sub">No porn/nudity, sexual content, violence, or illegal material. <RouterLink class="ar-link" to="/legal#content-policy">Read policy</RouterLink>.</div>
        </div>
      </div>

      <!-- pretty switch -->
      <button type="button" class="ar-switch" :class="{ on: modelValue }" @click="toggle" aria-pressed="modelValue">
        <span class="knob" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.ar-card{
  width:100%;
  border:1px solid rgba(255,255,255,.10);
  border-radius:14px;
  background: rgba(255,255,255,.04);
  padding:.75rem .85rem;
}
.ar-row{ display:flex; align-items:center; justify-content:space-between; gap:.75rem; }
.ar-left{ display:flex; align-items:flex-start; gap:.6rem; min-width:0; }
.ar-ico{ width:24px; height:24px; opacity:.9; margin-top:.1rem; }
.ar-text{ min-width:0; }
.ar-title{ font-weight:600; color:rgba(255,255,255,.95); line-height:1.15; font-size: 12px; }
.ar-sub{ font-size:.85rem; color:rgba(255,255,255,.75); line-height:1.25; font-size: 10px; }
.ar-link{ color:#cfe0ff; text-decoration: underline dotted; }
.ar-link:hover{ color:#fff; }

/* switch */
.ar-switch{
  position:relative; width:40px; height:22px; border-radius:9999px;
  border:1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.08);
  transition: all .18s ease; flex:0 0 auto;
}
.ar-switch .knob{
  position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:9999px;
  background: #fff; opacity:.9; transition: transform .18s ease;
}
.ar-switch.on{ border-color: rgba(167,139,250,.55); background: rgba(167,139,250,.25); box-shadow: 0 0 0 2px rgba(167,139,250,.12) inset; }
.ar-switch.on .knob{ transform: translateX(18px); }
</style>
