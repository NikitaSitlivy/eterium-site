<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/superbase';

const userEmail = ref<string | null>(null);
const profiles = ref<{ id: string; username: string | null }[]>([]);

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  userEmail.value = user?.email ?? null;

  const { data } = await supabase.from('profiles').select('id,username').limit(5);
  profiles.value = data ?? [];
});
</script>

<template>
  <main class="p-6 space-y-4 max-w-xl mx-auto">
    <h1 class="text-2xl font-bold">Supabase Debug</h1>
    <p><b>Текущий пользователь:</b> {{ userEmail ?? 'не авторизован' }}</p>
    <section>
      <h2 class="font-semibold">Первые профили:</h2>
      <ul class="list-disc ml-5">
        <li v-for="p in profiles" :key="p.id">{{ p.username ?? p.id }}</li>
      </ul>
      <p v-if="!profiles.length" class="opacity-70">Пока пусто.</p>
    </section>
  </main>
</template>
