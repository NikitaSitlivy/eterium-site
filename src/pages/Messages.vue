<!-- pages/Messages.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/superbase'
import { useAuth } from '../composables/useAuth'

/**
 * ===== TYPES =====
 */
type Conversation = {
  id: string | null        // null = друга пока нет чата
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

/**
 * ===== AUTH / ROUTE =====
 */
const route = useRoute()
const { user } = useAuth()
const myId = computed(() => user.value?.id ?? null)

/**
 * ===== STATE =====
 */
const loading = ref(true)
const conversations = ref<Conversation[]>([])
const currentConvId = ref<string | null>(null)
const messages = ref<MessageRow[]>([])
const sending = ref(false)
const text = ref('')
const err = ref<string | null>(null)
const subs: Array<ReturnType<typeof supabase.channel>> = []
const pendingDirect = ref(false)

/**
 * ===== SIMPLE E2E DEMO =====
 * На каждый conversation_id – свой ключ.
 * Ключ лежит только в localStorage.
 */
const LS_PREFIX = 'eterium_conv_key_'

function getLocalKey(convId: string): CryptoKey | null {
  // мы не можем хранить CryptoKey прямо в LS, поэтому положим base64, но для демо проще —
  // мы будем хранить сырой 32-байтовый ключ в LS и из него собирать CryptoKey
  return null
}

async function ensureConvKey(convId: string): Promise<CryptoKey> {
  const lsKey = localStorage.getItem(LS_PREFIX + convId)
  if (lsKey) {
    const raw = Uint8Array.from(atob(lsKey), c => c.charCodeAt(0))
    return await crypto.subtle.importKey(
      'raw',
      raw,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  }
  // генерим новый
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  const b64 = btoa(String.fromCharCode(...raw))
  localStorage.setItem(LS_PREFIX + convId, b64)
  return key
}

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let str = ''
  bytes.forEach(b => { str += String.fromCharCode(b) })
  return btoa(str)
}
function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

/**
 * Шифруем текст → строка вида: et1:<iv_b64>:<cipher_b64>
 */
async function encryptText(convId: string, plain: string): Promise<string> {
  const key = await ensureConvKey(convId)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder().encode(plain)
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc
  )
  return `et1:${bufToB64(iv.buffer)}:${bufToB64(cipher)}`
}

/**
 * Дешифруем, если это наш формат, иначе отдаём как есть
 */
async function decryptText(convId: string, row: { body: string | null }, otherUserId?: string | null): Promise<string> {
  const body = row.body || ''
  if (!body.startsWith('et1:')) {
    // старые либо тестовые
    return body
  }
  try {
    const [, ivB64, cB64] = body.split(':')
    const iv = new Uint8Array(b64ToBuf(ivB64))
    const cipher = b64ToBuf(cB64)
    const key = await ensureConvKey(convId)
    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher
    )
    return new TextDecoder().decode(plainBuf)
  } catch (e) {
    console.warn('decrypt failed', e)
    return '[encrypted]'
  }
}

/**
 * ===== 1. ЗАГРУЗКА ЧАТОВ =====
 */
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
  const othersArr = Array.from(otherIds)

  const { data: profs } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', othersArr.length ? othersArr : ['00000000-0000-0000-0000-000000000000'])

  const profMap = new Map<string, { username: string | null; avatar_url: string | null }>()
  ;(profs ?? []).forEach(p => {
    let av = p.avatar_url as string | null
    if (av && !/^https?:\/\//i.test(av)) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(av)
      av = data.publicUrl || null
    }
    profMap.set(p.id, { username: p.username, avatar_url: av })
  })

  // последние сообщения
  const { data: lastMsgs } = await supabase
    .from('messages')
    .select('id, conversation_id, body, created_at')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })
    .limit(1000)

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
    const prof = profMap.get(other.user_id) || null
    const last = lastByConv.get(cid) || null
    // расшифровать превью (если не получится — покажем как есть)
    let preview = last?.body ?? null
    if (preview) {
      preview = await decryptText(cid, { body: preview })
    }

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

  // сортировка
  list.sort((a, b) => {
    const ta = a.last_time ? new Date(a.last_time).getTime() : 0
    const tb = b.last_time ? new Date(b.last_time).getTime() : 0
    return tb - ta
  })

  return list
}

/**
 * ===== 2. ЗАГРУЗКА ДРУЗЕЙ =====
 */
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
      const other = row.requester === myId.value ? row.addressee : row.requester
      accepted.push(other)
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
    } as Conversation
  })
}

/**
 * ===== 3. собрать левую колонку =====
 */
async function loadAllLeft() {
  if (!myId.value) return
  loading.value = true
  err.value = null
  try {
    const [convList, friendList] = await Promise.all([
      loadConversationsOnly(),
      loadFriendsOnly()
    ])
    const convUserIds = new Set(convList.map(c => c.other_user_id))
    const onlyNewFriends = friendList.filter(f => !convUserIds.has(f.other_user_id))
    conversations.value = [...convList, ...onlyNewFriends]

    if (!currentConvId.value && convList[0]) {
      currentConvId.value = convList[0].id
      await loadMessages(convList[0].id!)
      subscribeToConversation(convList[0].id!)
    }
  } catch (e: any) {
    err.value = e?.message ?? 'Failed to load messages'
  } finally {
    loading.value = false
  }
}

/**
 * ===== 4. загрузка сообщений (с расшифровкой) =====
 */
async function loadMessages(convId: string) {
  if (!convId) return
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) {
    err.value = error.message
    messages.value = []
  } else {
    const conv = conversations.value.find(c => c.id === convId)
    const otherUserId = conv?.other_user_id
    const out: MessageRow[] = []
    for (const m of (data ?? [])) {
      const txt = await decryptText(convId, m, otherUserId)
      out.push({ ...m, body: txt })
    }
    messages.value = out
  }
}

/**
 * ===== 5. realtime =====
 */
function subscribeToConversation(convId: string) {
  while (subs.length) {
    const ch = subs.pop()
    ch?.unsubscribe()
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
        const newMsg = payload.new as MessageRow
        const conv = conversations.value.find(c => c.id === convId)
        const otherUserId = conv?.other_user_id
        const decryptedText = await decryptText(convId, newMsg, otherUserId)
        messages.value = [...messages.value, { ...newMsg, body: decryptedText }]
        await loadAllLeft()
      }
    )
    .subscribe()
  subs.push(ch)
}

watch(currentConvId, (val) => {
  if (val) {
    loadMessages(val)
    subscribeToConversation(val)
  }
})

/**
 * ===== 6. отправка =====
 */
async function sendMessage() {
  if (!text.value.trim() || !myId.value || !currentConvId.value) return
  sending.value = true
  const convId = currentConvId.value
  const plain = text.value.trim()
  try {
    // шифруем ПЕРЕД отправкой
    const encrypted = await encryptText(convId, plain)

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: convId,
        sender_id: myId.value,
        body: encrypted
      })
      .select()
      .single()

    if (!error && data) {
      text.value = ''
      // сразу расшифруем, чтобы не ждать realtime
      const decrypted = await decryptText(convId, data)
      messages.value = [
        ...messages.value,
        { ...data, body: decrypted }
      ]
      await loadAllLeft()
    }
  } finally {
    sending.value = false
  }
}

/**
 * ===== 7. создать диалог с другом =====
 */
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

/**
 * ===== init =====
 */
onMounted(async () => {
  await loadAllLeft()

  // если пришли /messages?to=...
  const to = route.query.to as string | undefined
  if (to && myId.value) {
    pendingDirect.value = true
    const convId = await startDirectWith(to)
    if (convId) {
      currentConvId.value = convId
      await loadMessages(convId)
      subscribeToConversation(convId)
    }
    pendingDirect.value = false
  }
})
</script>

<template>
  <main class="p-6 section mx-auto mt-16">
    <div class="flex gap-4 h-[calc(100vh-110px)]">
      <!-- LEFT -->
      <aside class="w-72 shrink-0 glass-card glass-panel p-3 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h1 class="text-lg font-semibold">Messages</h1>
          <span class="text-xs text-white/40">{{ conversations.length }} chat{{ conversations.length===1?'':'s' }}</span>
        </div>

        <div v-if="loading" class="text-sm text-white/40">Loading…</div>
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

      <!-- RIGHT -->
      <section class="flex-1 glass-card glass-panel flex flex-col min-w-0">
        <header class="px-4 py-3 border-b border-white/5 flex items-center gap-3">
          <div class="flex-1">
            <div class="text-sm font-semibold">
              {{ conversations.find(c => c.id === currentConvId)?.other_username || 'Select chat' }}
            </div>
            <div class="text-xs text-white/40">
              Direct chat
              <span v-if="pendingDirect" class="ml-1 text-[10px] text-white/25">opening…</span>
            </div>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          <div v-if="err" class="text-red-400 text-sm">{{ err }}</div>
          <div
            v-for="m in messages"
            :key="m.id"
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
          <div v-if="!currentConvId && !pendingDirect" class="text-sm text-white/30 mt-8 text-center">
            Select a conversation or click on a friend.
          </div>
        </div>

        <footer class="p-3 border-t border-white/5 flex gap-2">
          <input
            v-model="text"
            type="text"
            class="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-eter-accent"
            placeholder="Write a message…"
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
