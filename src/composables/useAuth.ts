import { ref, onMounted, onUnmounted, computed } from 'vue'
import { supabase } from '../lib/superbase'

const currentUser = ref<any>(null)
const loading = ref(true)

export function useAuth() {
  const isAuthed = computed(() => !!currentUser.value?.id)

  const loadSession = async () => {
    loading.value = true
    const { data } = await supabase.auth.getSession()
    currentUser.value = data.session?.user ?? null
    loading.value = false
  }

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

  let unsub: (() => void) | undefined
  onMounted(async () => {
    await loadSession()
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      currentUser.value = session?.user ?? null
    })
    unsub = data.subscription.unsubscribe
  })
  onUnmounted(() => unsub?.())

  return { user: currentUser, isAuthed, loading, signIn, signUp, signOut }
}
