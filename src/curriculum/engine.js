// Minimal CurriculumEngine for A1
// - Stores progress in localStorage
// - Provides the next topic and level
// - Accepts the result of a task and registers generated phrases

const LS_KEY = "curriculumProgressV1";

const PLAN_A1 = ["present_simple", "modal_basic", "negation_basic"];

const INITIAL_PROGRESS = {
  level: "A1",
  topicIndex: 0,
  stats: {}, // topicId: { correct, total }
  recent: [], // last shown phrases (german), for anti-repetition
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
  const avoid = (progress.recent || []).slice(-8); // up to the last 8
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
  // Keep the last 12
  progress.recent = arr.slice(-12);
  saveUserProgress(progress);
}
