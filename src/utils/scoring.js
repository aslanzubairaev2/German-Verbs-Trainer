/**
 * Utility functions for scoring and difficulty calculation.
 */

/**
 * Calculates the difficulty for the next phrase based on the user's performance.
 * As defined in the technical specification (6.1).
 *
 * @param {number} currentDifficulty - The difficulty of the last phrase (0.1 to 1.0).
 * @param {object} result - Information about the last answer.
 * @param {boolean} result.correct - Was the answer correct?
 * @param {number} result.streak - The user's current correct answer streak.
 * @param {number} responseTime - The time in milliseconds to answer.
 * @returns {number} The new difficulty, clamped between 0.1 and 1.0.
 */
export function calculateNextDifficulty(currentDifficulty, result, responseTime) {
  // 10 seconds is considered the baseline for a normal response time.
  const NORMAL_RESPONSE_TIME = 10000;

  // The time factor penalizes slow answers and rewards fast ones.
  // Capped at 2.0 to prevent extreme changes from very slow answers.
  const timeFactor = Math.min(responseTime / NORMAL_RESPONSE_TIME, 2.0);

  // If the answer is correct, decrease difficulty; if incorrect, increase it.
  const accuracyFactor = result.correct ? 0.9 : 1.1;

  // Reward longer streaks with a slight difficulty decrease.
  const streakFactor = result.streak > 5 ? 0.95 : 1.0;

  const newDifficulty = currentDifficulty * accuracyFactor * timeFactor * streakFactor;

  // Clamp the difficulty to be within the 0.1 to 1.0 range.
  return Math.max(0.1, Math.min(1.0, newDifficulty));
}

/**
 * Scores an answer based on correctness and other factors.
 * @param {string} userAnswer - The user's input.
 * @param {string} correctAnswer - The correct answer.
 * @returns {object} An object containing scoring information.
 */
export function scoreAnswer(userAnswer, correctAnswer) {
  const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase();
  // More complex scoring could be added here (e.g., partial credit).
  return {
    isCorrect,
  };
}
