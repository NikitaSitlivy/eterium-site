import { ref, computed } from 'vue'
import { supabase } from '../lib/superbase'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

const currentUser = ref<any>(null)
const loading = ref(true)
let authInitialized = false
let authInitPromise: Promise<void> | null = null

async function loadSession() {
  loading.value = true
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
    supabase.auth.onAuthStateChange(applySession)
    authInitialized = true
  })()

  await authInitPromise
}

export function useAuth() {
  const isAuthed = computed(() => !!currentUser.value?.id)
  void ensureAuthInitialized()

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    await loadSession()
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await loadSession()
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    currentUser.value = null
  }

  return { user: currentUser, isAuthed, loading, signIn, signUp, signOut }
}
