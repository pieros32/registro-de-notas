<template>
  <div class="login-wrap">
    <form class="login-card" @submit.prevent="submit">
      <div class="login-icon" aria-hidden="true">📚</div>
      <h1>Mis Notas</h1>
      <p class="login-sub">Acceso privado</p>
      <input v-model="email" type="email" placeholder="Correo" autocomplete="username" required />
      <input v-model="password" type="password" placeholder="Contraseña" autocomplete="current-password" required />
      <p v-if="error" class="login-error">{{ error }}</p>
      <button type="submit" :disabled="loading">{{ loading ? 'Entrando…' : 'Entrar' }}</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth.js';

const { login } = useAuth();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    await login(email.value, password.value);
  } catch {
    error.value = 'Correo o contraseña incorrectos.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-wrap { min-height: 100vh; display: grid; place-items: center; padding: 1rem; }
.login-card { width: 100%; max-width: 340px; display: flex; flex-direction: column; gap: 0.75rem; padding: 2rem; border-radius: 16px; background: var(--card-bg, #fff); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12); text-align: center; }
.login-icon { font-size: 2.5rem; }
h1 { margin: 0; font-size: 1.5rem; }
.login-sub { margin: 0 0 0.5rem; opacity: 0.7; }
input { padding: 0.7rem 0.9rem; border: 1px solid #8884; border-radius: 10px; font: inherit; background: transparent; color: inherit; }
button { padding: 0.75rem; border: 0; border-radius: 10px; font: inherit; font-weight: 600; background: #4f46e5; color: #fff; cursor: pointer; }
button:disabled { opacity: 0.6; cursor: default; }
.login-error { margin: 0; color: #dc2626; font-size: 0.9rem; }
</style>
