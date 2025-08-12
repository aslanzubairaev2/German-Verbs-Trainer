import {
  getNextTask,
  submitResult,
  registerGeneratedPhrase,
  getUserProgress,
  saveUserProgress,
} from "./engine";

beforeEach(() => {
  localStorage.clear();
});

test("getNextTask returns topic and constraints", () => {
  const t = getNextTask();
  expect(t.level).toBe("A1");
  expect(t.topic).toBeDefined();
  expect(Array.isArray(t.constraints.avoid)).toBe(true);
});

test("submitResult advances topic on sufficient accuracy", () => {
  // simulate 6 correct in a row
  const first = getNextTask();
  for (let i = 0; i < 6; i++) {
    submitResult(
      { taskId: Date.now(), topic: first.topic },
      { isCorrect: true }
    );
  }
  const p = getUserProgress();
  expect(p.topicIndex).toBe(1);
});

test("registerGeneratedPhrase stores recent", () => {
  for (let i = 0; i < 15; i++) registerGeneratedPhrase(`satz-${i}`);
  const p = getUserProgress();
  expect(p.recent.length).toBeLessThanOrEqual(12);
});
