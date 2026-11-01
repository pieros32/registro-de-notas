<template>
  <header class="header-top">
    <div class="header-content">
      <div class="brand-section">
        <div class="brand-icon" aria-hidden="true">
          <span>📚</span>
        </div>
        <div class="brand-title">
          <h1>
            Mis Notas
            <span class="brand-badge">Vue 3</span>
          </h1>
          <div class="brand-subtitle">Calculadora Ponderada de Calificaciones</div>
        </div>
      </div>

      <div class="header-actions">
        <!-- Promedio General Card -->
        <div class="general-stat-card">
          <div class="stat-label-group">
            <span class="stat-label">Promedio General</span>
            <span class="stat-sub">
              {{
                overallStats.coursesWithGrades > 0
                  ? `${overallStats.coursesWithGrades} de ${overallStats.totalCourses} cursos con notas`
                  : 'Sin notas registradas'
              }}
            </span>
          </div>
          <div
            class="stat-value"
            :class="{
              ok: overallStats.generalAvg !== null && overallStats.generalAvg >= passScore,
              bad: overallStats.generalAvg !== null && overallStats.generalAvg < passScore,
            }"
          >
            {{ overallStats.generalAvg !== null ? overallStats.generalAvg.toFixed(2) : '--' }}
          </div>
        </div>

        <!-- Dark Mode Toggle Button -->
        <button
          type="button"
          class="theme-btn"
          :title="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          :aria-label="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          @click="$emit('toggle-theme')"
        >
          <!-- Sun Icon -->
          <svg
            v-if="isDarkMode"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <!-- Moon Icon -->
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  overallStats: {
    type: Object,
    required: true,
  },
  isDarkMode: {
    type: Boolean,
    default: false,
  },
  passScore: {
    type: Number,
    default: 11,
  },
});

defineEmits(['toggle-theme']);
</script>
