import { ref, computed, watch } from 'vue';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { COURSES, PASS, MAX } from '../data/courses.js';

const SCENARIOS_KEY = 'notas-scenarios-v1';

// Scenarios are sandboxes: confirmed grades come from the main system and can't be changed
// here; only the not-yet-confirmed rows hold simulated values.
export function useScenarios(uid, { getGrade, isLocked, getCourseStats }) {
  const scenariosRef = doc(db, 'users', uid, 'data', 'scenarios');
  let remoteLoaded = false;
  let saveTimer;

  const scenarios = ref(loadInitial()); // newest first, doubles as the history
  const activeId = ref(null);

  function loadInitial() {
    try {
      const saved = localStorage.getItem(SCENARIOS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Error reading scenarios from localStorage:', e);
      return [];
    }
  }

  getDoc(scenariosRef)
    .then((snap) => {
      if (snap.exists()) scenarios.value = JSON.parse(snap.data().json);
      else if (scenarios.value.length) saveRemote(scenarios.value);
    })
    .catch((e) => console.error('Error loading scenarios from Firestore:', e))
    .finally(() => {
      remoteLoaded = true;
    });

  function saveRemote(val) {
    setDoc(scenariosRef, { json: JSON.stringify(val) }).catch((e) =>
      console.error('Error saving scenarios to Firestore:', e)
    );
  }

  watch(
    scenarios,
    (val) => {
      try {
        localStorage.setItem(SCENARIOS_KEY, JSON.stringify(val));
      } catch (e) {
        console.error('Error saving scenarios to localStorage:', e);
      }
      if (!remoteLoaded) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveRemote(val), 600);
    },
    { deep: true }
  );

  const active = computed(() => scenarios.value.find((s) => s.id === activeId.value) || null);

  const key = (courseId, index) => `${courseId}|${index}`;
  const randomGrade = () => String(Math.floor(Math.random() * (MAX + 1))); // whole numbers 0 - 20
  const find = (id) => scenarios.value.find((s) => s.id === id);

  function createScenario(name, random = false) {
    const s = {
      id: `sc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: name?.trim() || `Escenario ${scenarios.value.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      values: {},
    };
    scenarios.value = [s, ...scenarios.value];
    activeId.value = s.id;
    if (random) randomize(s.id);
    return s;
  }

  function duplicateScenario(id) {
    const src = find(id);
    if (!src) return;
    const copy = createScenario(`${src.name} (copia)`);
    find(copy.id).values = { ...src.values };
  }

  function removeScenario(id) {
    scenarios.value = scenarios.value.filter((s) => s.id !== id);
    if (activeId.value === id) activeId.value = null;
  }

  function renameScenario(id, name) {
    const s = find(id);
    if (s && name.trim()) {
      s.name = name.trim();
      s.updatedAt = Date.now();
    }
  }

  function setValue(id, courseId, index, raw) {
    const s = find(id);
    if (!s || isLocked(courseId, index)) return;
    const k = key(courseId, index);
    const num = parseFloat(raw);
    if (raw === '' || raw === null || isNaN(num)) delete s.values[k];
    else s.values[k] = String(Math.min(MAX, Math.max(0, Math.round(num))));
    s.updatedAt = Date.now();
  }

  // Fills (or clears) only the free rows; confirmed ones are never touched
  function fill(id, courseId, valueFn) {
    const s = find(id);
    if (!s) return;
    COURSES.filter((c) => !courseId || c.id === courseId).forEach((c) => {
      c.items.forEach((_, i) => {
        if (isLocked(c.id, i)) return;
        const v = valueFn();
        if (v === null) delete s.values[key(c.id, i)];
        else s.values[key(c.id, i)] = v;
      });
    });
    s.updatedAt = Date.now();
  }
  const randomize = (id, courseId) => fill(id, courseId, randomGrade);
  const clearValues = (id, courseId) => fill(id, courseId, () => null);

  // Grade as seen inside a scenario: confirmed from main, otherwise simulated
  const gradeIn = (s) => (course, index) =>
    isLocked(course.id, index) ? getGrade(course, index) : s.values[key(course.id, index)] ?? '';

  const courseStats = (s, course) => getCourseStats(course, gradeIn(s));

  function summary(s) {
    const avgs = COURSES.map((c) => courseStats(s, c).avg).filter((a) => a !== null);
    const generalAvg = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;
    return {
      generalAvg,
      passed: avgs.filter((a) => a >= PASS).length,
      failed: avgs.filter((a) => a < PASS).length,
    };
  }

  return {
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
  };
}
