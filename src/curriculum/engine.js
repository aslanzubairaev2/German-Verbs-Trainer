// Минимальный CurriculumEngine для A1
// - Хранит прогресс в localStorage
// - Выдаёт следующую тему (topic) и уровень (level)
// - Принимает результат выполнения задания и регистрирует сгенерированные фразы

const LS_KEY = "curriculumProgressV1";

const PLAN_A1 = ["present_simple", "modal_basic", "negation_basic"];

const INITIAL_PROGRESS = {
  level: "A1",
  topicIndex: 0,
  stats: {}, // topicId: { correct, total }
  recent: [], // последние показанные фразы (german), для анти-повторов
};

export function getUserProgress() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...INITIAL_PROGRESS };
    const parsed = JSON.parse(raw);
    return { ...INITIAL_PROGRESS, ...parsed };
  } catch {
    return { ...INITIAL_PROGRESS };
  }
}

export function saveUserProgress(progress) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(progress));
  } catch {}
}

export function resetProgress() {
  saveUserProgress({ ...INITIAL_PROGRESS });
}

export function getNextTask() {
  const progress = getUserProgress();
  const topic = PLAN_A1[progress.topicIndex % PLAN_A1.length];
  const avoid = (progress.recent || []).slice(-8); // до 8 последних
  return {
    taskId: Date.now(),
    level: progress.level,
    topic,
    constraints: { avoid },
  };
}

export function submitResult({ taskId, topic }, { isCorrect }) {
  const progress = getUserProgress();
  const key = topic || PLAN_A1[progress.topicIndex % PLAN_A1.length];
  const s = progress.stats[key] || { correct: 0, total: 0 };
  s.total += 1;
  if (isCorrect) s.correct += 1;
  progress.stats[key] = s;

  const accuracy = s.total > 0 ? s.correct / s.total : 0;
  if (s.correct >= 6 && accuracy >= 0.75) {
    progress.topicIndex = (progress.topicIndex + 1) % PLAN_A1.length;
  }

  saveUserProgress(progress);
  return progress;
}

export function registerGeneratedPhrase(german) {
  if (!german) return;
  const progress = getUserProgress();
  const arr = Array.isArray(progress.recent) ? progress.recent : [];
  arr.push(german);
  // Держим последние 12
  progress.recent = arr.slice(-12);
  saveUserProgress(progress);
}
