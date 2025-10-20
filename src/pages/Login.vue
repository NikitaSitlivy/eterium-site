<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const email = ref(''); const password = ref('');
const { signIn, signUp, signOut, errorMsg } = useAuth();
const msg = ref<string | null>(null);

async function handleSignIn() {
  msg.value = null;
  const ok = await signIn(email.value, password.value);
  msg.value = ok ? 'Вход выполнен' : (errorMsg.value ?? 'Ошибка входа');
}
async function handleSignUp() {
  msg.value = null;
  const ok = await signUp(email.value, password.value);
  msg.value = ok ? 'Регистрация ок. Проверь почту (если включено подтверждение).' : (errorMsg.value ?? 'Ошибка регистрации');
}
async function handleSignOut() {
  await signOut(); msg.value = 'Выход выполнен';
}
</script>

<template>
  <main class="p-6 max-w-sm mx-auto space-y-3">
    <input v-model="email" type="email" placeholder="Email" class="w-full border rounded p-2" />
    <input v-model="password" type="password" placeholder="Пароль" class="w-full border rounded p-2" />
    <div class="flex gap-2">
      <button @click="handleSignIn" class="px-3 py-2 border rounded">Войти</button>
      <button @click="handleSignUp" class="px-3 py-2 border rounded">Регистрация</button>
      <button @click="handleSignOut" class="px-3 py-2 border rounded">Выйти</button>
    </div>
    <p class="opacity-70" v-if="msg">{{ msg }}</p>
  </main>
</template>
