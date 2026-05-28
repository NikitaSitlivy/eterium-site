<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/superbase'

type Notif = { id: string; type: string; data: any; created_at: string; read_at: string | null }

const items = ref<Notif[]>([])
const userId = ref<string | null>(null)
const loading = ref(false)
const err = ref<string | null>(null)
const unreadCount = computed(() => items.value.filter(n => !n.read_at).length)

function renderNotifTitle(n: Notif) {
  const d: any = n.data || {}
  switch (n.type) {
    case 'purchase': return `Purchase: ${d.item_name ?? 'Unknown item'}`
    case 'drop': return `You got a drop: ${d.title ?? 'Unknown drop'}`
    case 'message': return `New message from ${d.from ?? 'someone'}`
    case 'system': return d.text ?? 'System update'
    default: return 'Notification'
  }
}

async function load() {
  loading.value = true
  err.value = null
  try {
    if (!userId.value) {
      const { data } = await supabase.auth.getUser()
      userId.value = data.user?.id ?? null
    }
    if (!userId.value) {
      items.value = []
      return
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId.value)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    items.value = (data ?? []) as any
  } catch (e: any) {
    err.value = e?.message || 'Failed to load notifications'
  } finally {
    loading.value = false
  }
}

async function markAllRead() {
  if (!userId.value) return
  const readAt = new Date().toISOString()
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('user_id', userId.value)
      .is('read_at', null)
    if (!error) items.value = items.value.map(n => ({ ...n, read_at: readAt as any }))
    else err.value = error.message || 'Failed to mark read'
    // Notify header to refresh its notifications/unread counter
    window.dispatchEvent(new Event('notifications:updated'))
  } catch (e: any) { err.value = e?.message || 'Failed to mark read' }
}

onMounted(load)
</script>

<template>
  <main class="eter-page">
    <div class="eter-frame">
      <section class="eter-section eter-hero">
        <div class="eter-hero-panel">
          <div class="eter-hero-content">
            <div>
              <div class="eter-eyebrow">Inbox</div>
              <h1 class="eter-title">Notifications</h1>
              <p class="eter-subtitle">{{ unreadCount }} unread update{{ unreadCount===1?'':'s' }}</p>
            </div>
            <button class="nav-cta" @click="markAllRead" :disabled="unreadCount===0">Mark all read</button>
          </div>
        </div>
      </section>

    <section class="eter-section eter-content">
    <div class="eter-panel p-4 md:p-6">
      <p v-if="err" class="text-red-400">{{ err }}</p>
      <div v-else-if="!loading && items.length === 0" class="text-center text-white/80">No notifications yet.</div>
      <div v-else class="">
        <div v-for="n in items" :key="n.id" class="notif-item" :class="{ unread: !n.read_at }">
          <div class="notif-type">{{ n.type }}</div>

          <div class="notif-body">
            <div class="notif-text">{{ n.data.text||renderNotifTitle(n) }}</div>
            <div class="notif-time">{{ new Date(n.created_at).toLocaleString() }}</div>
          </div>
        </div>
      </div>
    </div>
    </section>
    </div>
  </main>
</template>
