<template>
  <main class="eter-page">
    <div class="eter-frame">
      <section class="eter-section eter-hero">
        <div class="eter-hero-panel">
          <div class="eter-hero-content">
            <div>
              <div class="eter-eyebrow">Collection</div>
              <h1 class="eter-title">Inventory</h1>
              <p class="eter-subtitle">Browse items earned from games, drops, and events.</p>
            </div>
            <div v-if="loading" class="eter-muted">Loading...</div>
          </div>
        </div>
      </section>

      <section class="eter-section eter-content">
        <div v-if="!isAuthed && !loading" class="eter-panel p-6 text-center">
          <p class="mb-4">Sign in to view your inventory.</p>
          <button class="cta" @click="$emit('signin')">Sign in</button>
        </div>

        <div v-else-if="items.length === 0 && !loading" class="eter-panel p-6 text-center">
          <p class="mb-2">You don't have any items yet.</p>
          <p class="text-white/60">Earn items in-game or get them from events.</p>
        </div>

        <div v-else class="inventory-grid">
          <div v-for="it in items" :key="it.key" class="eter-panel inventory-card">
            <div class="inventory-art">
              <img :src="it.icon_url" :alt="it.name" loading="lazy" />
            </div>
            <div class="inventory-meta">
              <div class="inventory-name" :title="it.name">{{ it.name }}</div>
              <span :class="['inventory-rarity', rarityClass(it.rarity)]">{{ it.rarity }}</span>
            </div>
            <div class="text-xs text-white/60">Acquired: {{ formatDate(it.acquired_at) }}</div>
          </div>
        </div>
      </section>
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
  } | {
    id: string
    name: string
    rarity: 'common'|'uncommon'|'rare'|'epic'|'legendary'
    icon_url: string
    meta: Record<string, unknown>
  }[] | null
  acquired_at: string
}

const loading = ref(true)
const userId = ref<string | null>(null)
const rows = ref<ItemRow[]>([])

const isAuthed = computed(() => !!userId.value)

const items = computed(() =>
  rows.value
    .map(r => {
      const item = Array.isArray(r.items) ? r.items[0] : r.items
      if (!item) return null
      return {
        key: `${item.id}-${r.acquired_at}`,
        id: item.id,
        name: item.name,
        rarity: item.rarity,
        icon_url: item.icon_url,
        acquired_at: r.acquired_at
      }
    })
    .filter((it): it is NonNullable<typeof it> => Boolean(it))
)

type Rarity = 'common'|'uncommon'|'rare'|'epic'|'legendary'
function rarityClass(r: Rarity | string) {
  if (r === 'legendary') return 'rarity-legendary'
  if (r === 'epic') return 'rarity-epic'
  if (r === 'rare') return 'rarity-rare'
  if (r === 'uncommon') return 'rarity-uncommon'
  return 'rarity-common'
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
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
    rows.value = data as unknown as ItemRow[]
  }
  loading.value = false
})
</script>

<style scoped>
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.inventory-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.inventory-art {
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.4);
}

.inventory-art img {
  width: 74%;
  height: 74%;
  object-fit: contain;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.55));
}

.inventory-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.inventory-name {
  min-width: 0;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inventory-rarity {
  flex: 0 0 auto;
  border-radius: 6px;
  padding: 0.22rem 0.5rem;
  font-size: 10px;
  line-height: 1;
  text-transform: uppercase;
}

.rarity-legendary { background: rgba(255, 210, 90, 0.18); color: #ffe18a; border: 1px solid rgba(255, 210, 90, 0.35); }
.rarity-epic { background: rgba(170, 120, 255, 0.18); color: #decbff; border: 1px solid rgba(170, 120, 255, 0.35); }
.rarity-rare { background: rgba(110, 170, 255, 0.18); color: #cfe3ff; border: 1px solid rgba(110, 170, 255, 0.35); }
.rarity-uncommon { background: rgba(90, 210, 140, 0.18); color: #c6ffd9; border: 1px solid rgba(90, 210, 140, 0.35); }
.rarity-common { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.9); border: 1px solid rgba(255, 255, 255, 0.16); }

@media (min-width: 768px) {
  .inventory-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .inventory-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
