<template>
  <section class="sc-layout">
    <!-- History -->
    <aside class="sc-history">
      <div class="sc-history-head">
        <h2>Historial de escenarios</h2>
        <span class="sc-count">{{ scenarios.length }}</span>
      </div>
      <form class="sc-new" @submit.prevent="onCreate(false)">
        <input v-model="newName" class="search-input" placeholder="Nombre del escenario" />
        <div class="sc-new-actions">
          <button type="submit" class="confirm-btn">+ Crear vacío</button>
          <button type="button" class="btn-secondary" @click="onCreate(true)">🎲 Al azar</button>
        </div>
      </form>

      <p v-if="!scenarios.length" class="sc-empty">Aún no hay escenarios. Crea el primero.</p>
      <ul v-else class="sc-list">
        <li
          v-for="s in scenarios"
          :key="s.id"
          class="sc-item"
          :class="{ active: s.id === activeId }"
          @click="activeId = s.id"
        >
          <div class="sc-item-main">
            <strong>{{ s.name }}</strong>
            <small>{{ formatDate(s.updatedAt) }}</small>
          </div>
          <span
            class="sc-item-avg"
            :class="{
              ok: summary(s).generalAvg !== null && summary(s).generalAvg >= PASS,
              bad: summary(s).generalAvg !== null && summary(s).generalAvg < PASS,
            }"
          >
            {{ summary(s).generalAvg !== null ? summary(s).generalAvg.toFixed(2) : '--' }}
          </span>
          <button type="button" class="sc-icon-btn" title="Eliminar escenario" @click.stop="toDelete = s">
            ✕
          </button>
        </li>
      </ul>
    </aside>

    <!-- Editor -->
    <div class="sc-editor">
      <div v-if="!active" class="empty-state">
        <p>Selecciona o crea un escenario para simular notas sin afectar tus notas confirmadas.</p>
      </div>
      <template v-else>
        <div class="sc-editor-head">
          <input
            class="sc-title-input"
            :value="active.name"
            aria-label="Nombre del escenario"
            @change="renameScenario(active.id, $event.target.value)"
          />
          <div class="sc-editor-actions">
            <div
              class="sc-total"
              :class="{
                ok: total.generalAvg !== null && total.generalAvg >= PASS,
                bad: total.generalAvg !== null && total.generalAvg < PASS,
              }"
            >
              Promedio general:
              <strong>{{ total.generalAvg !== null ? total.generalAvg.toFixed(2) : '--' }}</strong>
            </div>
            <button type="button" class="btn-secondary" @click="randomize(active.id)">🎲 Aleatorio todo</button>
            <button type="button" class="btn-secondary" @click="clearValues(active.id)">Limpiar</button>
            <button type="button" class="btn-secondary" @click="duplicateScenario(active.id)">Duplicar</button>
          </div>
        </div>
        <p class="sc-note">
          🔒 Las notas confirmadas vienen del sistema principal y no se pueden cambiar aquí. Solo puedes
          simular las evaluaciones que aún no están confirmadas. Los cambios se guardan solos.
        </p>

        <div class="grid-courses">
          <article v-for="course in COURSES" :key="course.id" class="course-card">
            <div class="card-head">
              <div class="course-title-wrap">
                <span class="course-id-tag">{{ course.id }}</span>
                <h2>{{ course.name }}</h2>
              </div>
              <div class="avg-box">
                <div
                  class="avg-badge"
                  :class="{
                    ok: stats(course).avg !== null && stats(course).avg >= PASS,
                    bad: stats(course).avg !== null && stats(course).avg < PASS,
                  }"
                >
                  {{ stats(course).avg !== null ? stats(course).avg.toFixed(2) : '--' }}
                </div>
              </div>
            </div>

            <div class="table-wrap">
              <table class="eval-table">
                <thead>
                  <tr>
                    <th>Evaluación</th>
                    <th class="center">Peso %</th>
                    <th class="center">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in course.items" :key="item.code">
                    <td>
                      <span class="eval-name">{{ item.code }}</span>
                      <small class="eval-desc">{{ item.name }}</small>
                    </td>
                    <td class="center">{{ getWeight(course, index) }}</td>
                    <td class="center">
                      <span v-if="isLocked(course.id, index)" class="fixed-grade">
                        🔒 {{ getGrade(course, index) }}
                      </span>
                      <input
                        v-else
                        type="number"
                        min="0"
                        :max="MAX"
                        step="1"
                        class="grade-input"
                        :class="{ 'is-graded': cell(course, index) !== '' }"
                        placeholder="--"
                        :value="cell(course, index)"
                        @input="setValue(active.id, course.id, index, $event.target.value)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              v-if="stats(course).hasAnyGrades && !stats(course).isCompleted"
              class="target-alert"
              :class="stats(course).passStatus"
            >
              <span v-if="stats(course).passStatus === 'secured'">🎉 Aprobado asegurado.</span>
              <span v-else-if="stats(course).passStatus === 'achievable'">
                🎯 Necesitas <strong>{{ stats(course).neededInRemaining.toFixed(2) }}</strong> en lo restante.
              </span>
              <span v-else-if="stats(course).passStatus === 'impossible'">⚠️ Ya no es posible aprobar.</span>
            </div>

            <div class="confirm-row">
              <button type="button" class="btn-secondary" @click="randomize(active.id, course.id)">
                🎲 Aleatorio curso
              </button>
              <button type="button" class="btn-secondary" @click="clearValues(active.id, course.id)">Limpiar</button>
            </div>
          </article>
        </div>
      </template>
    </div>

    <ConfirmModal
      :is-open="!!toDelete"
      title="¿Eliminar escenario?"
      :message="`Se eliminará «${toDelete?.name}» del historial. Tus notas confirmadas no se ven afectadas.`"
      confirm-text="Sí, eliminar"
      @confirm="doDelete"
      @cancel="toDelete = null"
    />
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import ConfirmModal from './ConfirmModal.vue';

const props = defineProps({
  api: { type: Object, required: true }, // useScenarios() result
  COURSES: { type: Array, required: true },
  PASS: { type: Number, required: true },
  MAX: { type: Number, required: true },
  getWeight: { type: Function, required: true },
  getGrade: { type: Function, required: true },
  isLocked: { type: Function, required: true },
});

const {
  scenarios,
  activeId,
  active,
  createScenario,
  duplicateScenario,
  removeScenario,
  renameScenario,
  setValue,
  randomize,
  clearValues,
  courseStats,
  summary,
} = props.api;

const newName = ref('');
const toDelete = ref(null);

const total = computed(() => (active.value ? summary(active.value) : { generalAvg: null }));
const stats = (course) => courseStats(active.value, course);
const cell = (course, index) => active.value.values[`${course.id}|${index}`] ?? '';

function onCreate(random) {
  createScenario(newName.value, random);
  newName.value = '';
}

function doDelete() {
  removeScenario(toDelete.value.id);
  toDelete.value = null;
}

const formatDate = (t) => new Date(t).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
</script>
