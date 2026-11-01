<template>
  <article class="course-card" :id="'card-' + course.id">
    <!-- Card Header -->
    <div class="card-head">
      <div class="course-title-wrap">
        <span class="course-id-tag">{{ course.id }}</span>
        <h2>{{ course.name }}</h2>
      </div>

      <!-- Average Badge -->
      <div class="avg-box">
        <div
          class="avg-badge"
          :class="{
            ok: stats.avg !== null && stats.avg >= passScore,
            bad: stats.avg !== null && stats.avg < passScore,
          }"
        >
          {{ stats.avg !== null ? stats.avg.toFixed(2) : '--' }}
        </div>
        <span
          class="avg-status-text"
          :class="{
            ok: stats.avg !== null && stats.avg >= passScore,
            bad: stats.avg !== null && stats.avg < passScore,
            pending: stats.avg === null,
          }"
        >
          {{
            stats.avg === null
              ? 'Sin notas'
              : stats.avg >= passScore
              ? 'Aprobando'
              : 'En riesgo'
          }}
        </span>
      </div>
    </div>

    <!-- Accumulated Points Bar -->
    <div class="accum-section">
      <div class="accum-label-row">
        <span>
          Acumulado:
          <strong class="accum-strong">{{ stats.earned.toFixed(2) }}</strong>
          / {{ stats.maxPossiblePoints.toFixed(2) }} pts
        </span>
        <span>{{ Math.round((stats.usedWeight / (stats.totalWeight || 1)) * 100) }}% evaluado</span>
      </div>
      <div class="progress-bar-bg" title="Progreso de acumulación de puntos">
        <div
          class="progress-bar-fill"
          :class="{
            ok: stats.earned >= passScore,
            bad: stats.avg !== null && stats.avg < passScore,
          }"
          :style="{
            width: `${Math.min(100, (stats.earned / (stats.maxPossiblePoints || 1)) * 100)}%`,
          }"
        ></div>
      </div>
    </div>

    <!-- Target Prediction Pill -->
    <div
      v-if="stats.hasAnyGrades && !stats.isCompleted"
      class="target-alert"
      :class="stats.passStatus"
    >
      <span v-if="stats.passStatus === 'secured'">
        🎉 <strong>¡Aprobado asegurado!</strong> Ya acumulaste los {{ passScore }} pts necesarios.
      </span>
      <span v-else-if="stats.passStatus === 'achievable'">
        🎯 Necesitas promediar <strong>{{ stats.neededInRemaining.toFixed(2) }}</strong> en las evaluaciones restantes para aprobar ({{ passScore }}).
      </span>
      <span v-else-if="stats.passStatus === 'impossible'">
        ⚠️ Matemáticamente no es posible alcanzar los {{ passScore }} pts con los pesos restantes.
      </span>
    </div>

    <!-- Evaluations Table -->
    <div class="table-wrap">
      <table class="eval-table">
        <thead>
          <tr>
            <th>Evaluación</th>
            <th class="center">Peso %</th>
            <th class="center">Nota</th>
            <th class="right">Aporte</th>
            <th class="center">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in course.items" :key="item.code">
            <td>
              <span class="eval-name">{{ item.code }}</span>
              <small class="eval-desc">{{ item.name }}</small>
            </td>
            <td class="center">
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                class="weight-input"
                :value="getWeight(course, index)"
                :disabled="isLocked(course.id, index)"
                @input="onWeightInput(index, $event.target.value)"
                title="Editar porcentaje de peso"
              />
            </td>
            <td class="center">
              <input
                type="number"
                min="0"
                :max="maxScore"
                step="1"
                class="grade-input"
                :class="{
                  'is-graded': getGrade(course, index) !== '',
                  ok: getGrade(course, index) !== '' && Number(getGrade(course, index)) >= passScore,
                  bad: getGrade(course, index) !== '' && Number(getGrade(course, index)) < passScore,
                }"
                placeholder="--"
                :value="getGrade(course, index)"
                :disabled="isLocked(course.id, index)"
                @input="onGradeInput(index, $event.target.value)"
                title="Ingresar nota (0 - 20)"
              />
            </td>
            <td
              class="pts-cell"
              :class="{ 'has-points': getGrade(course, index) !== '' }"
            >
              {{ calculateAporte(index) }}
            </td>
            <td class="center">
              <button
                v-if="isLocked(course.id, index)"
                type="button"
                class="lock-btn"
                title="Modificar esta nota (deberás confirmarla de nuevo)"
                @click="$emit('unlock', { courseId: course.id, index })"
              >
                🔒 Modificar
              </button>
              <span v-else class="draft-tag">Borrador</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Weight Warning Alert -->
    <div v-if="!stats.isWeightValid" class="warn-box">
      <span>
        ⚠️ Los pesos suman <strong>{{ stats.totalWeight }}%</strong> (deberían sumar 100%).
      </span>
      <button
        type="button"
        class="warn-action-btn"
        title="Restablecer los pesos predeterminados de este curso"
        @click="$emit('reset-weights', course)"
      >
        Restablecer
      </button>
    </div>

    <!-- Confirm grades -->
    <div class="confirm-row">
      <button
        type="button"
        class="confirm-btn"
        :disabled="pendingCount === 0"
        @click="$emit('confirm', course)"
      >
        ✔ Confirmar notas<template v-if="pendingCount"> ({{ pendingCount }})</template>
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  course: {
    type: Object,
    required: true,
  },
  stats: {
    type: Object,
    required: true,
  },
  getWeight: {
    type: Function,
    required: true,
  },
  getGrade: {
    type: Function,
    required: true,
  },
  isLocked: {
    type: Function,
    required: true,
  },
  pendingCount: {
    type: Number,
    default: 0,
  },
  passScore: {
    type: Number,
    default: 12,
  },
  maxScore: {
    type: Number,
    default: 20,
  },
});

const emit = defineEmits(['update-weight', 'update-grade', 'reset-weights', 'confirm', 'unlock']);

function onWeightInput(index, val) {
  emit('update-weight', { courseId: props.course.id, index, value: val });
}

function onGradeInput(index, val) {
  emit('update-grade', { courseId: props.course.id, index, value: val });
}

function calculateAporte(index) {
  const g = props.getGrade(props.course, index);
  if (g === '' || isNaN(parseFloat(g))) return '0.00';
  const w = props.getWeight(props.course, index);
  return ((parseFloat(g) * w) / 100).toFixed(2);
}
</script>
