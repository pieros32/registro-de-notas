<template>
  <div class="app-layout">
    <!-- Header -->
    <HeaderBar
      :overall-stats="overallStats"
      :is-dark-mode="isDarkMode"
      :pass-score="PASS"
      @toggle-theme="toggleTheme"
    />

    <!-- Main Content -->
    <main>
      <!-- Toolbar -->
      <section class="toolbar-container" aria-label="Filtros y acciones">
        <!-- Search bar -->
        <div class="search-box">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="searchQuery"
            type="search"
            class="search-input"
            placeholder="Buscar curso o evaluación..."
            aria-label="Buscar curso"
          />
        </div>

        <!-- Filter Segmented Buttons -->
        <div class="filter-group">
          <button
            type="button"
            class="filter-btn"
            :class="{ active: statusFilter === 'all' }"
            @click="statusFilter = 'all'"
          >
            Todos ({{ COURSES.length }})
          </button>
          <button
            type="button"
            class="filter-btn"
            :class="{ active: statusFilter === 'passed' }"
            @click="statusFilter = 'passed'"
          >
            Aprobando ({{ overallStats.passedCount }})
          </button>
          <button
            type="button"
            class="filter-btn"
            :class="{ active: statusFilter === 'failed' }"
            @click="statusFilter = 'failed'"
          >
            En riesgo ({{ overallStats.failedCount }})
          </button>
          <button
            type="button"
            class="filter-btn"
            :class="{ active: statusFilter === 'pending' }"
            @click="statusFilter = 'pending'"
          >
            Sin notas ({{ overallStats.totalCourses - overallStats.coursesWithGrades }})
          </button>
        </div>

        <!-- Danger Action: Reset All -->
        <div>
          <button
            type="button"
            class="btn-danger-outline"
            @click="isResetModalOpen = true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Borrar todas las notas
          </button>
        </div>
      </section>

      <!-- Courses Grid -->
      <div v-if="filteredCourses.length > 0" class="grid-courses">
        <CourseCard
          v-for="course in filteredCourses"
          :key="course.id"
          :course="course"
          :stats="getCourseStats(course)"
          :get-weight="getWeight"
          :get-grade="getGrade"
          :pass-score="PASS"
          :max-score="MAX"
          @update-weight="handleUpdateWeight"
          @update-grade="handleUpdateGrade"
          @reset-weights="handleResetWeights"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <p>No se encontraron cursos que coincidan con "{{ searchQuery }}".</p>
      </div>

      <!-- Informative hint footer -->
      <footer class="hint-footer">
        <p>
          💡 <strong>Guía de cálculo:</strong> Escala 0–20. El promedio de cada curso se calcula solo con las notas ingresadas ponderadas por su peso. El promedio general es el promedio simple de los cursos que ya cuentan con calificaciones registradas. Los pesos se pueden editar dinámicamente y los cambios se guardan de forma automática en tu navegador.
        </p>
      </footer>
    </main>

    <!-- Modal for clearing grades -->
    <ConfirmModal
      :is-open="isResetModalOpen"
      title="¿Restablecer todas las notas?"
      message="Esta acción borrará todas las notas ingresadas y restablecerá los pesos de todos los cursos a sus valores predeterminados. ¿Deseas continuar?"
      confirm-text="Sí, restablecer todo"
      cancel-text="Cancelar"
      @confirm="confirmResetAll"
      @cancel="isResetModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useGrades } from './composables/useGrades.js';
import HeaderBar from './components/HeaderBar.vue';
import CourseCard from './components/CourseCard.vue';
import ConfirmModal from './components/ConfirmModal.vue';

const {
  COURSES,
  PASS,
  MAX,
  searchQuery,
  statusFilter,
  isDarkMode,
  toggleTheme,
  applyThemeClass,
  getWeight,
  getGrade,
  setWeight,
  setGrade,
  resetCourseWeights,
  resetAll,
  getCourseStats,
  overallStats,
  filteredCourses,
} = useGrades();

const isResetModalOpen = ref(false);

function handleUpdateWeight({ courseId, index, value }) {
  setWeight(courseId, index, value);
}

function handleUpdateGrade({ courseId, index, value }) {
  setGrade(courseId, index, value);
}

function handleResetWeights(course) {
  resetCourseWeights(course);
}

function confirmResetAll() {
  resetAll();
  isResetModalOpen.value = false;
}

onMounted(() => {
  applyThemeClass();
});
</script>
