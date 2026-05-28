<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/superbase'

const userEmail = ref<string | null>(null)
const profiles = ref<{ id: string; username: string | null }[]>([])

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  userEmail.value = user?.email ?? null

  const { data } = await supabase.from('profiles').select('id,username').limit(5)
  profiles.value = data ?? []
})
</script>

<template>
  <main class="eter-page">
    <div class="eter-frame">
      <section class="eter-section eter-hero">
        <div class="eter-hero-panel">
          <div class="eter-hero-content">
            <div>
              <div class="eter-eyebrow">Debug</div>
              <h1 class="eter-title">Supabase Debug</h1>
              <p class="eter-subtitle">Quick readout for auth state and profile connectivity.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="eter-section eter-content">
        <div class="eter-panel p-6 space-y-4 max-w-xl mx-auto">
          <p><b>Current user:</b> {{ userEmail ?? 'not authenticated' }}</p>
          <section>
            <h2 class="font-semibold">First profiles:</h2>
            <ul class="list-disc ml-5">
              <li v-for="p in profiles" :key="p.id">{{ p.username ?? p.id }}</li>
            </ul>
            <p v-if="!profiles.length" class="opacity-70">No rows yet.</p>
          </section>
        </div>
      </section>
    </div>
  </main>
</template>
