<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="cancel">
    <div class="modal-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <h3 :id="titleId">{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" @click="cancel">
          {{ cancelText }}
        </button>
        <button type="button" class="btn-danger" @click="confirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '¿Estás seguro?',
  },
  message: {
    type: String,
    default: 'Esta acción no se puede deshacer.',
  },
  confirmText: {
    type: String,
    default: 'Confirmar',
  },
  cancelText: {
    type: String,
    default: 'Cancelar',
  },
});

const emit = defineEmits(['confirm', 'cancel']);

const titleId = 'modal-title-' + Math.random().toString(36).substring(2, 9);

function confirm() {
  emit('confirm');
}

function cancel() {
  emit('cancel');
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    cancel();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>
