<!-- pages/Messages.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/superbase'
import { useAuth } from '../composables/useAuth'

type Conversation = {
  id: string | null
  other_user_id: string
  other_username: string | null
  other_avatar_url: string | null
  last_message?: string | null
  last_time?: string | null
  source: 'conversation' | 'friend'
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string | null
  body: string | null
  created_at: string
}

const route = useRoute()
const { user } = useAuth()
const myId = computed(() => user.value?.id ?? null)

const loading = ref(true)
const conversations = ref<Conversation[]>([])
const currentConvId = ref<string | null>(null)
const messages = ref<MessageRow[]>([])
const sending = ref(false)
const text = ref('')
const err = ref<string | null>(null)
const subs: Array<ReturnType<typeof supabase.channel>> = []
const pendingDirect = ref(false)

const messageViewport = ref<HTMLElement | null>(null)
const loadingOlder = ref(false)
const hasMoreOlder = ref(true)
const oldestLoadedAt = ref<string | null>(null)

const viewportScrollTop = ref(0)
const viewportHeight = ref(0)

const PAGE_SIZE = 50
const ESTIMATED_ROW_HEIGHT = 76
const OVERSCAN = 8

const virtualStart = computed(() =>
  Math.max(0, Math.floor(viewportScrollTop.value / ESTIMATED_ROW_HEIGHT) - OVERSCAN)
)
const virtualEnd = computed(() =>
  Math.min(
    messages.value.length,
    Math.ceil((viewportScrollTop.value + viewportHeight.value) / ESTIMATED_ROW_HEIGHT) + OVERSCAN
  )
)
const visibleMessages = computed(() => messages.value.slice(virtualStart.value, virtualEnd.value))
const topSpacerHeight = computed(() => virtualStart.value * ESTIMATED_ROW_HEIGHT)
const bottomSpacerHeight = computed(() =>
  Math.max(0, (messages.value.length - virtualEnd.value) * ESTIMATED_ROW_HEIGHT)
)

function appendMessageUnique(next: MessageRow) {
  if (messages.value.some(m => m.id === next.id)) return
  messages.value = [...messages.value, next]
}

function syncViewportMetrics() {
  const el = messageViewport.value
  if (!el) return
  viewportHeight.value = el.clientHeight
  viewportScrollTop.value = el.scrollTop
}

function isNearBottom() {
  const el = messageViewport.value
  if (!el) return true
  return el.scrollHeight - (el.scrollTop + el.clientHeight) < 96
}

async function scrollToBottom() {
  await nextTick()
  const el = messageViewport.value
  if (!el) return
  el.scrollTop = el.scrollHeight
  viewportScrollTop.value = el.scrollTop
}

const LS_PREFIX = 'eterium_conv_key_'

async function ensureConvKey(convId: string): Promise<CryptoKey> {
  const lsKey = localStorage.getItem(LS_PREFIX + convId)
  if (lsKey) {
    const raw = Uint8Array.from(atob(lsKey), c => c.charCodeAt(0))
    return await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  const b64 = btoa(String.fromCharCode(...raw))
  localStorage.setItem(LS_PREFIX + convId, b64)
  return key
}

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

async function decryptText(convId: string, row: { body: string | null }): Promise<string> {
  const body = row.body || ''
  if (!body.startsWith('et1:')) return body
  try {
    const [, ivB64, cB64] = body.split(':')
    const iv = new Uint8Array(b64ToBuf(ivB64))
    const cipher = b64ToBuf(cB64)
    const key = await ensureConvKey(convId)
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
    return new TextDecoder().decode(plainBuf)
  } catch {
    return '[encrypted]'
  }
}

async function loadConversationsOnly(): Promise<Conversation[]> {
  if (!myId.value) return []

  const { data: memberRows, error: mErr } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', myId.value)
  if (mErr) throw mErr

  const convIds = (memberRows ?? []).map(r => r.conversation_id)
  if (convIds.length === 0) return []

  const { data: allMembers, error: allErr } = await supabase
    .from('conversation_members')
    .select('conversation_id, user_id')
    .in('conversation_id', convIds)
  if (allErr) throw allErr

  const otherIds = new Set<string>()
  for (const m of allMembers ?? []) {
    if (m.user_id !== myId.value) otherIds.add(m.user_id)
  }

  const { data: profs } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', Array.from(otherIds).length ? Array.from(otherIds) : ['00000000-0000-0000-0000-000000000000'])

  const profMap = new Map<string, { username: string | null; avatar_url: string | null }>()
  ;(profs ?? []).forEach(p => {
    let av = p.avatar_url as string | null
    if (av && !/^https?:\/\//i.test(av)) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(av)
      av = data.publicUrl || null
    }
    profMap.set(p.id, { username: p.username, avatar_url: av })
  })

  const { data: lastMsgs } = await supabase
    .from('messages')
    .select('conversation_id, body, created_at')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })
    .limit(200)

  const lastByConv = new Map<string, { body: string | null; created_at: string }>()
  for (const m of lastMsgs ?? []) {
    if (!lastByConv.has(m.conversation_id)) {
      lastByConv.set(m.conversation_id, { body: m.body, created_at: m.created_at })
    }
  }

  const list: Conversation[] = []
  for (const cid of convIds) {
    const membersOfConv = (allMembers ?? []).filter(m => m.conversation_id === cid)
    const other = membersOfConv.find(m => m.user_id !== myId.value)
    if (!other) continue

    const prof = profMap.get(other.user_id)
    const last = lastByConv.get(cid)
    let preview = last?.body ?? null
    if (preview) preview = await decryptText(cid, { body: preview })

    list.push({
      id: cid,
      other_user_id: other.user_id,
      other_username: prof?.username ?? null,
      other_avatar_url: prof?.avatar_url ?? null,
      last_message: preview,
      last_time: last?.created_at ?? null,
      source: 'conversation'
    })
  }

  list.sort((a, b) => {
    const ta = a.last_time ? new Date(a.last_time).getTime() : 0
    const tb = b.last_time ? new Date(b.last_time).getTime() : 0
    return tb - ta
  })

  return list
}

async function loadFriendsOnly(): Promise<Conversation[]> {
  if (!myId.value) return []

  const { data, error } = await supabase
    .from('friendships')
    .select('requester, addressee, status')
    .or(`requester.eq.${myId.value},addressee.eq.${myId.value}`)
  if (error) return []

  const accepted: string[] = []
  for (const row of data ?? []) {
    if (row.status === 'accepted') {
      accepted.push(row.requester === myId.value ? row.addressee : row.requester)
    }
  }
  if (accepted.length === 0) return []

  const { data: profs } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', accepted)

  return (profs ?? []).map(p => {
    let av = p.avatar_url as string | null
    if (av && !/^https?:\/\//i.test(av)) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(av)
      av = data.publicUrl || null
    }
    return {
      id: null,
      other_user_id: p.id,
      other_username: p.username ?? null,
      other_avatar_url: av ?? null,
      source: 'friend'
    }
  })
}

async function loadAllLeft() {
  if (!myId.value) return
  loading.value = true
  err.value = null
  try {
    const [convList, friendList] = await Promise.all([loadConversationsOnly(), loadFriendsOnly()])
    const convUserIds = new Set(convList.map(c => c.other_user_id))
    const onlyNewFriends = friendList.filter(f => !convUserIds.has(f.other_user_id))
    conversations.value = [...convList, ...onlyNewFriends]

    if (!currentConvId.value && convList[0]) {
      currentConvId.value = convList[0].id
    }
  } catch (e: any) {
    err.value = e?.message ?? 'Failed to load messages'
  } finally {
    loading.value = false
  }
}

async function loadMessages(convId: string) {
  if (!convId) return
  hasMoreOlder.value = true
  oldestLoadedAt.value = null

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) {
    err.value = error.message
    messages.value = []
    return
  }

  const out: MessageRow[] = []
  const ordered = [...(data ?? [])].reverse()
  for (const m of ordered) {
    const txt = await decryptText(convId, m)
    out.push({ ...m, body: txt })
  }
  messages.value = out
  oldestLoadedAt.value = out[0]?.created_at ?? null
  hasMoreOlder.value = (data?.length ?? 0) === PAGE_SIZE
  await scrollToBottom()
}

async function loadOlderMessages() {
  if (!currentConvId.value || !oldestLoadedAt.value || loadingOlder.value || !hasMoreOlder.value) return
  loadingOlder.value = true

  const convId = currentConvId.value
  const el = messageViewport.value
  const prevHeight = el?.scrollHeight ?? 0

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .lt('created_at', oldestLoadedAt.value)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (error) throw error

    const chunk: MessageRow[] = []
    const ordered = [...(data ?? [])].reverse()
    for (const m of ordered) {
      const txt = await decryptText(convId, m)
      chunk.push({ ...m, body: txt })
    }

    if (chunk.length === 0) {
      hasMoreOlder.value = false
      return
    }

    messages.value = [...chunk, ...messages.value]
    oldestLoadedAt.value = messages.value[0]?.created_at ?? oldestLoadedAt.value
    hasMoreOlder.value = (data?.length ?? 0) === PAGE_SIZE

    await nextTick()
    if (el) {
      const newHeight = el.scrollHeight
      el.scrollTop += newHeight - prevHeight
      viewportScrollTop.value = el.scrollTop
    }
  } catch (e: any) {
    err.value = e?.message ?? 'Failed to load older messages'
  } finally {
    loadingOlder.value = false
  }
}

function subscribeToConversation(convId: string) {
  while (subs.length) {
    subs.pop()?.unsubscribe()
  }

  const ch = supabase
    .channel(`conv-${convId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`
      },
      async payload => {
        const shouldStick = isNearBottom()
        const newMsg = payload.new as MessageRow
        const decryptedText = await decryptText(convId, newMsg)
        appendMessageUnique({ ...newMsg, body: decryptedText })
        if (shouldStick) await scrollToBottom()
        await loadAllLeft()
      }
    )
    .subscribe()

  subs.push(ch)
}

watch(currentConvId, async (val) => {
  if (!val) return
  await loadMessages(val)
  subscribeToConversation(val)
})

async function sendMessage() {
  if (!text.value.trim() || !myId.value || !currentConvId.value) return
  sending.value = true
  const convId = currentConvId.value
  const plain = text.value.trim()

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: convId,
        sender_id: myId.value,
        body: plain
      })
      .select()
      .single()

    if (!error && data) {
      text.value = ''
      const decrypted = await decryptText(convId, data)
      appendMessageUnique({ ...data, body: decrypted })
      await scrollToBottom()
      await loadAllLeft()
    }
  } finally {
    sending.value = false
  }
}

async function startDirectWith(targetUserId: string): Promise<string | null> {
  if (!myId.value || !targetUserId || targetUserId === myId.value) return null

  const { data: myConvs } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', myId.value)
  const convIds = (myConvs ?? []).map(c => c.conversation_id)

  if (convIds.length > 0) {
    const { data: otherConvs } = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds)
      .eq('user_id', targetUserId)
    if (otherConvs && otherConvs.length > 0) {
      return otherConvs[0].conversation_id
    }
  }

  const { data: conv, error: cErr } = await supabase
    .from('conversations')
    .insert({ type: 'direct' })
    .select()
    .single()
  if (cErr || !conv) return null

  await supabase.from('conversation_members').insert([
    { conversation_id: conv.id, user_id: myId.value },
    { conversation_id: conv.id, user_id: targetUserId }
  ])

  await loadAllLeft()
  return conv.id as string
}

async function onMessagesScroll() {
  syncViewportMetrics()
  if (viewportScrollTop.value < 72 && hasMoreOlder.value && !loadingOlder.value) {
    await loadOlderMessages()
  }
}

onMounted(async () => {
  await loadAllLeft()
  await nextTick()
  syncViewportMetrics()

  const to = route.query.to as string | undefined
  if (to && myId.value) {
    pendingDirect.value = true
    const convId = await startDirectWith(to)
    if (convId) currentConvId.value = convId
    pendingDirect.value = false
  }
})

onBeforeUnmount(() => {
  while (subs.length) {
    subs.pop()?.unsubscribe()
  }
})
</script>

<template>
  <main class="p-6 section mx-auto mt-16">
    <div class="flex gap-4 h-[calc(100vh-110px)]">
      <aside class="w-72 shrink-0 glass-card glass-panel p-3 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h1 class="text-lg font-semibold">Messages</h1>
          <span class="text-xs text-white/40">{{ conversations.length }} chat{{ conversations.length===1?'':'s' }}</span>
        </div>

        <div v-if="loading" class="text-sm text-white/40">Loading...</div>
        <div v-else-if="conversations.length === 0" class="text-sm text-white/40">
          No conversations yet.
        </div>
        <div v-else class="flex-1 overflow-y-auto space-y-2">
          <button
            v-for="c in conversations"
            :key="c.source + '-' + c.other_user_id + '-' + (c.id || 'new')"
            class="conv-item"
            :class="{ active: c.id && c.id === currentConvId }"
            @click="c.id ? currentConvId = c.id : (async () => {
              const newId = await startDirectWith(c.other_user_id)
              if (newId) currentConvId = newId
            })()"
          >
            <div class="flex items-center gap-2">
              <img
                v-if="c.other_avatar_url"
                :src="c.other_avatar_url"
                class="w-8 h-8 rounded-full object-cover"
              />
              <div
                v-else
                class="w-8 h-8 rounded-full bg-white/10 grid place-items-center text-xs"
              >
                {{ (c.other_username || 'U').slice(0,1).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-sm truncate flex items-center gap-1">
                  {{ c.other_username || 'Unknown user' }}
                  <span v-if="c.source === 'friend' && !c.id" class="text-[9px] px-1 rounded bg-white/10 text-white/50">friend</span>
                </div>
                <div class="text-[11px] text-white/40 truncate">
                  {{ c.last_message || (c.source === 'friend' ? 'Tap to chat' : 'No messages yet') }}
                </div>
              </div>
            </div>
          </button>
        </div>
      </aside>

      <section class="flex-1 glass-card glass-panel flex flex-col min-w-0">
        <header class="px-4 py-3 border-b border-white/5 flex items-center gap-3">
          <div class="flex-1">
            <div class="text-sm font-semibold">
              {{ conversations.find(c => c.id === currentConvId)?.other_username || 'Select chat' }}
            </div>
            <div class="text-xs text-white/40">
              Direct chat
              <span v-if="pendingDirect" class="ml-1 text-[10px] text-white/25">opening...</span>
            </div>
          </div>
        </header>

        <div
          ref="messageViewport"
          class="flex-1 overflow-y-auto px-4 py-4"
          @scroll="onMessagesScroll"
        >
          <div v-if="err" class="text-red-400 text-sm">{{ err }}</div>
          <div v-if="loadingOlder" class="text-xs text-white/40 text-center mb-2">Loading older messages...</div>

          <template v-if="currentConvId">
            <div :style="{ height: topSpacerHeight + 'px' }"></div>
            <div
              v-for="m in visibleMessages"
              :key="m.id"
              class="msg-row"
            >
              <div
                class="msg"
                :class="{ mine: m.sender_id === myId }"
              >
                <div class="bubble">
                  {{ m.body }}
                </div>
                <div class="time">
                  {{ new Date(m.created_at).toLocaleTimeString() }}
                </div>
              </div>
            </div>
            <div :style="{ height: bottomSpacerHeight + 'px' }"></div>
          </template>

          <div v-if="!currentConvId && !pendingDirect" class="text-sm text-white/30 mt-8 text-center">
            Select a conversation or click on a friend.
          </div>
        </div>

        <footer class="p-3 border-t border-white/5 flex gap-2">
          <input
            v-model="text"
            type="text"
            class="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-eter-accent"
            placeholder="Write a message..."
            @keyup.enter="sendMessage"
            :disabled="!currentConvId"
          />
          <button class="cta" @click="sendMessage" :disabled="sending || !currentConvId">
            Send
          </button>
        </footer>
      </section>
    </div>
  </main>
</template>

<style scoped>
.conv-item{
  width:100%;
  text-align:left;
  border:1px solid transparent;
  background: rgba(255,255,255,.01);
  border-radius: .75rem;
  padding:.4rem .45rem;
  transition: background .12s ease, border .12s ease;
}
.conv-item:hover{ background: rgba(255,255,255,.04); }
.conv-item.active{
  background: rgba(142,180,255,.12);
  border-color: rgba(142,180,255,.35);
}
.msg-row {
  margin-bottom: 8px;
}
.msg{
  display:flex;
  flex-direction:column;
  max-width: 58%;
}
.msg.mine{
  margin-left:auto;
  align-items:flex-end;
}
.bubble{
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.04);
  border-radius: 1rem;
  padding:.35rem .7rem .4rem;
  font-size:.875rem;
  line-height:1.3;
  width: fit-content;
  word-break: break-word;
}
.msg.mine .bubble{
  background: rgba(143,195,255,.12);
  border-color: rgba(143,195,255,.18);
}
.time{
  font-size:.625rem;
  color: rgba(255,255,255,.3);
  margin-top:.15rem;
}
</style>
