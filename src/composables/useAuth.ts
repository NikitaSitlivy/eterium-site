import { ref, computed } from 'vue'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

const currentUser = ref<any>(null)
const loading = ref(true)
let authInitialized = false
let authInitPromise: Promise<void> | null = null

async function getSupabase() {
  const mod = await import('../lib/superbase')
  return mod.supabase
}

async function loadSession() {
  loading.value = true
  const supabase = await getSupabase()
  const { data } = await supabase.auth.getSession()
  currentUser.value = data.session?.user ?? null
  loading.value = false
}

function applySession(_event: AuthChangeEvent, session: Session | null) {
  currentUser.value = session?.user ?? null
  loading.value = false
}

async function ensureAuthInitialized() {
  if (authInitialized) return
  if (authInitPromise) return authInitPromise

  authInitPromise = (async () => {
    await loadSession()
    const supabase = await getSupabase()
    supabase.auth.onAuthStateChange(applySession)
    authInitialized = true
  })()

  await authInitPromise
}

export function useAuth() {
  const isAuthed = computed(() => !!currentUser.value?.id)

  const signUp = async (email: string, password: string) => {
    const supabase = await getSupabase()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    await loadSession()
  }

  const signIn = async (email: string, password: string) => {
    const supabase = await getSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await loadSession()
  }

  const signOut = async () => {
    const supabase = await getSupabase()
    await supabase.auth.signOut()
    currentUser.value = null
  }

  return { user: currentUser, isAuthed, loading, signIn, signUp, signOut, ensureAuthInitialized }
}
