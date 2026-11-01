import { ref, computed, watch } from 'vue';
import { COURSES, PASS, MAX, STORAGE_KEY, THEME_KEY } from '../data/courses.js';

export function useGrades() {
  // State: { "courseId|index": { grade: string, weight: number | string } }
  const state = ref(loadInitialState());
  const searchQuery = ref('');
  const statusFilter = ref('all'); // 'all', 'passed', 'failed', 'pending'
  const isDarkMode = ref(loadInitialTheme());

  function loadInitialState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.warn('Error reading grades from localStorage:', e);
      return {};
    }
  }

  function loadInitialTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  }

  function toggleTheme() {
    isDarkMode.value = !isDarkMode.value;
    try {
      localStorage.setItem(THEME_KEY, isDarkMode.value ? 'dark' : 'light');
    } catch {}
    applyThemeClass();
  }

  function applyThemeClass() {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Auto save on state changes
  watch(
    state,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
      } catch (e) {
        console.error('Error saving grades to localStorage:', e);
      }
    },
    { deep: true }
  );

  const getKey = (courseId, index) => `${courseId}|${index}`;

  const getWeight = (course, index) => {
    const k = getKey(course.id, index);
    const w = state.value[k]?.weight;
    if (w === undefined) return course.items[index].weight;
    if (w === '') return '';
    const num = Number(w);
    return isNaN(num) ? 0 : num;
  };

  const getGrade = (course, index) => {
    const k = getKey(course.id, index);
    return state.value[k]?.grade ?? '';
  };

  const setGrade = (courseId, index, rawValue) => {
    const k = getKey(courseId, index);
    const item = { ...(state.value[k] || {}) };

    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      item.grade = '';
      state.value = { ...state.value, [k]: item };
      return;
    }

    const num = parseFloat(rawValue);
    if (isNaN(num)) {
      item.grade = '';
      state.value = { ...state.value, [k]: item };
      return;
    }

    if (num > MAX) {
      item.grade = String(MAX);
    } else if (num < 0) {
      item.grade = '0';
    } else {
      item.grade = rawValue;
    }

    state.value = { ...state.value, [k]: item };
  };

  const setWeight = (courseId, index, rawValue) => {
    const k = getKey(courseId, index);
    const item = { ...(state.value[k] || {}) };

    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      item.weight = '';
      state.value = { ...state.value, [k]: item };
      return;
    }

    const num = parseFloat(rawValue);
    if (isNaN(num)) {
      item.weight = 0;
    } else if (num > 100) {
      item.weight = 100;
    } else if (num < 0) {
      item.weight = 0;
    } else {
      item.weight = rawValue;
    }

    state.value = { ...state.value, [k]: item };
  };

  const resetCourseWeights = (course) => {
    const updated = { ...state.value };
    course.items.forEach((item, index) => {
      const k = getKey(course.id, index);
      if (updated[k]) {
        updated[k] = { ...updated[k], weight: item.weight };
      }
    });
    state.value = updated;
  };

  const resetAll = () => {
    state.value = {};
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const getCourseStats = (course) => {
    let earned = 0;
    let usedWeight = 0;
    let totalWeight = 0;
    let gradedCount = 0;

    course.items.forEach((_, i) => {
      const rawW = getWeight(course, i);
      const w = rawW === '' ? 0 : Number(rawW);
      totalWeight += w;
      const g = getGrade(course, i);
      if (g !== '') {
        const val = parseFloat(g);
        if (!isNaN(val)) {
          earned += (val * w) / 100;
          usedWeight += w;
          gradedCount++;
        }
      }
    });

    const isWeightValid = Math.abs(totalWeight - 100) < 0.001;
    const avg = usedWeight > 0 ? (earned * 100) / usedWeight : null;
    const isPassed = avg !== null && avg >= PASS;
    const isCompleted = gradedCount === course.items.length;
    const hasAnyGrades = gradedCount > 0;
    const remainingWeight = Math.max(0, totalWeight - usedWeight);
    const maxPossiblePoints = (totalWeight * MAX) / 100;

    // Simulation for target PASS (11.00)
    let neededInRemaining = null;
    let passStatus = 'pending';

    if (avg !== null && isCompleted) {
      passStatus = isPassed ? 'passed' : 'failed';
    } else if (earned >= PASS) {
      passStatus = 'secured';
      neededInRemaining = 0;
    } else if (remainingWeight > 0) {
      const neededPoints = PASS - earned;
      const neededAvg = (neededPoints * 100) / remainingWeight;
      if (neededAvg > MAX) {
        passStatus = 'impossible';
        neededInRemaining = null;
      } else {
        passStatus = 'achievable';
        neededInRemaining = Math.max(0, neededAvg);
      }
    }

    return {
      earned,
      usedWeight,
      totalWeight,
      isWeightValid,
      avg,
      isPassed,
      isCompleted,
      hasAnyGrades,
      gradedCount,
      totalCount: course.items.length,
      maxPossiblePoints,
      remainingWeight,
      neededInRemaining,
      passStatus,
    };
  };

  // Overall Statistics across all courses
  const overallStats = computed(() => {
    const avgs = [];
    let passedCount = 0;
    let failedCount = 0;

    COURSES.forEach((c) => {
      const stats = getCourseStats(c);
      if (stats.avg !== null) {
        avgs.push(stats.avg);
        if (stats.avg >= PASS) {
          passedCount++;
        } else {
          failedCount++;
        }
      }
    });

    const count = avgs.length;
    const generalAvg = count > 0 ? avgs.reduce((acc, curr) => acc + curr, 0) / count : null;

    return {
      generalAvg,
      coursesWithGrades: count,
      totalCourses: COURSES.length,
      passedCount,
      failedCount,
      isGeneralPassed: generalAvg !== null && generalAvg >= PASS,
    };
  });

  // Filtered courses based on search & status filter
  const filteredCourses = computed(() => {
    return COURSES.filter((course) => {
      const matchesSearch =
        course.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        course.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        course.items.some((it) => it.code.toLowerCase().includes(searchQuery.value.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter.value === 'all') return true;

      const stats = getCourseStats(course);
      if (statusFilter.value === 'passed') return stats.avg !== null && stats.avg >= PASS;
      if (statusFilter.value === 'failed') return stats.avg !== null && stats.avg < PASS;
      if (statusFilter.value === 'pending') return stats.avg === null;

      return true;
    });
  });

  return {
    COURSES,
    PASS,
    MAX,
    state,
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
  };
}
