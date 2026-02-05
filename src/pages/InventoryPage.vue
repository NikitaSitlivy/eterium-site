<template>
  <main class="container mx-auto px-4 py-8 mt-10 section">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Inventory</h1>
      <div v-if="loading" class="text-white/60">Loading…</div>
    </div>

    <div v-if="!isAuthed && !loading" class="card p-6 text-center glass-card glass-panel">
      <p class="mb-4">Sign in to view your inventory.</p>
      <button class="cta" @click="$emit('signin')">Sign in</button>
    </div>

    <div v-else-if="items.length === 0 && !loading" class="card p-6 text-center glass-card glass-panel">
<p class="mb-2">You don't have any items yet.</p>
<p class="text-white/60">Earn items in-game or get them from events.</p>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="it in items" :key="it.key" class="card p-4 flex flex-col gap-3 glass-card glass-panel">
        <div class="aspect-square w-full overflow-hidden rounded-xl bg-black/40 grid place-items-center">
          <img :src="it.icon_url" :alt="it.name" class="w-3/4 h-3/4 object-contain" loading="lazy" />
        </div>
        <div class="flex items-center justify-between">
          <div class="font-medium truncate">{{ it.name }}</div>
          <span :class="['px-2 py-0.5 rounded text-xs uppercase', rarityClass(it.rarity)]">{{ it.rarity }}</span>
        </div>
      <div class="text-xs text-white/60">Acquired: {{ formatDate(it.acquired_at) }}</div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { supabase } from '../lib/superbase'

type ItemRow = {
  items: {
    id: string
    name: string
    rarity: 'common'|'uncommon'|'rare'|'epic'|'legendary'
    icon_url: string
    meta: Record<string, unknown>
  }
  acquired_at: string
}

const loading = ref(true)
const userId = ref<string | null>(null)
const rows = ref<ItemRow[]>([])

const isAuthed = computed(() => !!userId.value)

const items = computed(() =>
  rows.value.map(r => ({
    key: `${r.items.id}-${r.acquired_at}`,
    id: r.items.id,
    name: r.items.name,
    rarity: r.items.rarity,
    icon_url: r.items.icon_url,
    acquired_at: r.acquired_at
  }))
)

type Rarity = 'common'|'uncommon'|'rare'|'epic'|'legendary'
function rarityClass(r: Rarity | string) {
  if (r === 'legendary') return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
  if (r === 'epic') return 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
  if (r === 'rare') return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
  if (r === 'uncommon') return 'bg-green-500/20 text-green-300 border border-green-500/30'
  return 'bg-white/10 text-white/80 border border-white/10'
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${m}.${y} ${hh}:${mm}`
}


onMounted(async () => {
  const { data: auth } = await supabase.auth.getUser()
  userId.value = auth.user ? auth.user.id : null
  if (!userId.value) {
    loading.value = false
    return
  }

  const { data, error } = await supabase
    .from('inventory')
    .select('acquired_at, items(id, name, rarity, icon_url, meta)')
    .order('acquired_at', { ascending: false })

  if (!error && data) {
    rows.value = data as ItemRow[]
  }
  loading.value = false
})
</script>

<style scoped>
.card { @apply bg-white/5 rounded-2xl shadow-lg shadow-black/20 border border-white/10; }
.cta { @apply inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-medium transition; }
</style>
