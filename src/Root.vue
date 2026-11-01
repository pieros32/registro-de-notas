<template>
  <div v-if="!authReady" class="boot">Cargando…</div>
  <App v-else-if="user" :key="user.uid" :uid="user.uid" />
  <LoginScreen v-else />
</template>

<script setup>
import App from './App.vue';
import LoginScreen from './components/LoginScreen.vue';
import { useAuth } from './composables/useAuth.js';

const { user, authReady } = useAuth();
</script>

<style scoped>
.boot { min-height: 100vh; display: grid; place-items: center; opacity: 0.6; }
</style>
