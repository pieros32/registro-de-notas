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
      <nav class="view-tabs" aria-label="Vista">
        <button type="button" class="filter-btn" :class="{ active: view === 'notas' }" @click="view = 'notas'">📒 Notas</button>
        <button type="button" class="filter-btn" :class="{ active: view === 'escenarios' }" @click="view = 'escenarios'">🧪 Escenarios ({{ scenarioApi.scenarios.value.length }})</button>
      </nav>

      <ScenariosView
        v-if="view === 'escenarios'"
        :api="scenarioApi"
        :COURSES="COURSES"
        :PASS="PASS"
        :MAX="MAX"
        :get-weight="getWeight"
        :get-grade="getGrade"
        :is-locked="isLocked"
      />

      <!-- Toolbar -->
      <section v-show="view === 'notas'" class="toolbar-container" aria-label="Filtros y acciones">
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
            Borrar notas sin confirmar
          </button>
          <button type="button" class="btn-danger-outline" @click="logout">
            Cerrar sesión
          </button>
        </div>
      </section>

      <!-- Courses Grid -->
      <div v-if="view === 'notas' && filteredCourses.length > 0" class="grid-courses">
        <CourseCard
          v-for="course in filteredCourses"
          :key="course.id"
          :course="course"
          :stats="getCourseStats(course)"
          :get-weight="getWeight"
          :get-grade="getGrade"
          :is-locked="isLocked"
          :pending-count="pendingCount(course)"
          :pass-score="PASS"
          :max-score="MAX"
          @update-weight="handleUpdateWeight"
          @update-grade="handleUpdateGrade"
          @reset-weights="handleResetWeights"
          @confirm="confirmCourse"
          @unlock="({ courseId, index }) => unlockRow(courseId, index)"
        />
      </div>

      <!-- Empty State -->
      <div v-else-if="view === 'notas'" class="empty-state">
        <p>No se encontraron cursos que coincidan con "{{ searchQuery }}".</p>
      </div>

      <!-- Informative hint footer -->
      <footer v-show="view === 'notas'" class="hint-footer">
        <p>
          💡 <strong>Guía de cálculo:</strong> Escala 0–20. El promedio de cada curso se calcula solo con las notas ingresadas ponderadas por su peso. El promedio general es el promedio simple de los cursos que ya cuentan con calificaciones registradas. Los pesos se pueden editar dinámicamente y los cambios se guardan de forma automática en tu navegador.
        </p>
      </footer>
    </main>

    <!-- Modal for clearing grades -->
    <ConfirmModal
      :is-open="isResetModalOpen"
      title="¿Borrar las notas sin confirmar?"
      message="Se borrarán las notas en borrador (sin confirmar). Las notas ya confirmadas permanecen fijas y solo se pueden cambiar con «Modificar». ¿Deseas continuar?"
      confirm-text="Sí, borrar borradores"
      cancel-text="Cancelar"
      @confirm="confirmResetAll"
      @cancel="isResetModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useGrades } from './composables/useGrades.js';
import { useAuth } from './composables/useAuth.js';
import HeaderBar from './components/HeaderBar.vue';
import CourseCard from './components/CourseCard.vue';
import ConfirmModal from './components/ConfirmModal.vue';
import ScenariosView from './components/ScenariosView.vue';
import { useScenarios } from './composables/useScenarios.js';

const props = defineProps({ uid: { type: String, required: true } });

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
  isLocked,
  pendingCount,
  confirmCourse,
  unlockRow,
  setWeight,
  setGrade,
  resetCourseWeights,
  resetAll,
  getCourseStats,
  overallStats,
  filteredCourses,
} = useGrades(props.uid);

const { logout } = useAuth();

const view = ref('notas');
const scenarioApi = useScenarios(props.uid, { getGrade, isLocked, getCourseStats });

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
