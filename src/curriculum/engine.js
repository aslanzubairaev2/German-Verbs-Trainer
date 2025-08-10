// Минимальный CurriculumEngine для A1
// - Хранит прогресс в localStorage
// - Выдаёт следующую тему (topic) и уровень (level)
// - Принимает результат выполнения задания

const LS_KEY = "curriculumProgressV1";

const PLAN_A1 = [
  // Простая последовательность тем A1
  "present_simple", // простые утверждения/вопросы/отрицания (коротко)
  "modal_basic", // können/müssen/wollen + инфинитив
  "negation_basic", // nicht/kein
];

const INITIAL_PROGRESS = {
  level: "A1",
  topicIndex: 0,
  stats: {
    // topicId: { correct, total }
  },
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
  return {
    taskId: Date.now(),
    level: progress.level,
    topic,
    constraints: {},
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
  // Простые критерии перехода: 6 верных с точностью >= 0.75
  if (s.correct >= 6 && accuracy >= 0.75) {
    progress.topicIndex = (progress.topicIndex + 1) % PLAN_A1.length;
    // Сбрасывать статистику по пройденной теме не будем — аккумулируем
  }

  saveUserProgress(progress);
  return progress;
}


