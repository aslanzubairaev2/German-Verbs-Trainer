import SpacedRepetition from './SpacedRepetition';
import { DIFFICULTY_WEIGHTS } from '../data/difficulty-levels';

/**
 * Service for tracking and updating user progress.
 * Based on the technical specification (4.3.2).
 */
class ProgressTracker {
  /**
   * Updates the user's progress object after a phrase has been answered.
   * @param {object} userProgress - The current user progress object.
   * @param {object} phrase - The phrase that was answered.
   * @param {object} result - The result of the answer.
   * @param {boolean} result.isCorrect - Whether the answer was correct.
   * @returns {object} The new, updated user progress object.
   */
  updateProgress(userProgress, phrase, result) {
    const { isCorrect } = result;

    // 1. Update general stats
    const newTotalAnswers = userProgress.totalAnswers + 1;
    const newCorrectAnswers = isCorrect ? userProgress.correctAnswers + 1 : userProgress.correctAnswers;
    const newStreak = isCorrect ? userProgress.currentStreak + 1 : 0;
    const newLongestStreak = Math.max(userProgress.longestStreak, newStreak);

    // 2. Find and update the phrase in history
    let phraseFound = false;
    const newPhraseHistory = userProgress.phraseHistory.map(historyItem => {
      if (historyItem.phraseId === phrase.id) {
        phraseFound = true;
        const updatedItem = SpacedRepetition.updateRepetitionData(historyItem, isCorrect);
        return {
          ...updatedItem,
          attempts: historyItem.attempts + 1,
          correctAttempts: isCorrect ? historyItem.correctAttempts + 1 : historyItem.correctAttempts,
        };
      }
      return historyItem;
    });

    // 3. If it's a new phrase, add it to the history
    if (!phraseFound) {
      const newHistoryItem = {
        phraseId: phrase.id,
        attempts: 1,
        correctAttempts: isCorrect ? 1 : 0,
        // Initial SM-2 values
        easinessFactor: 2.5,
        repetitions: 0,
        interval: 0,
      };
      const updatedItem = SpacedRepetition.updateRepetitionData(newHistoryItem, isCorrect);
      newPhraseHistory.push(updatedItem);
    }

    return {
      ...userProgress,
      totalAnswers: newTotalAnswers,
      correctAnswers: newCorrectAnswers,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      phraseHistory: newPhraseHistory,
    };
  }

  /**
   * Calculates the inherent difficulty of a phrase based on its components.
   * @param {object} phrase - The phrase object.
   * @returns {number} A difficulty score from 0.0 to 1.0+.
   */
  calculateDifficulty(phrase) {
    let difficulty = 0;
    const { pronoun, verb, sentenceType } = phrase;

    if (pronoun && DIFFICULTY_WEIGHTS.pronouns[pronoun]) {
      difficulty += DIFFICULTY_WEIGHTS.pronouns[pronoun];
    }
    if (verb && verb.type && DIFFICULTY_WEIGHTS.verbTypes[verb.type]) {
      difficulty += DIFFICULTY_WEIGHTS.verbTypes[verb.type];
    }
    if (sentenceType && DIFFICULTY_WEIGHTS.sentenceTypes[sentenceType]) {
      difficulty += DIFFICULTY_WEIGHTS.sentenceTypes[sentenceType];
    }

    // Normalize to a 0.1-1.0 scale (approximate)
    return Math.min(1.0, Math.max(0.1, difficulty / 2.0));
  }

  /**
   * Identifies areas where the user is struggling.
   * @param {object} userProgress - The user's progress object.
   * @returns {Array<string>} A list of weak areas (e.g., grammar topics).
   */
  getWeakAreas(userProgress) {
    const weakAreas = new Map();
    userProgress.phraseHistory.forEach(item => {
      // A "weak" item has been answered incorrectly more than correctly,
      // or has a low easiness factor.
      if (item.correctAttempts < item.attempts / 2 || item.easinessFactor < 2.0) {
        // This requires phrase data to be linked back, which is a next step.
        // For now, this is a placeholder.
        // e.g., const phraseData = getPhraseById(item.phraseId);
        // phraseData.grammarFocus.forEach(focus => {
        //   weakAreas.set(focus, (weakAreas.get(focus) || 0) + 1);
        // });
      }
    });

    // Return the top 3 weak areas
    return [...weakAreas.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
  }

  /**
   * Determines if a user should advance to the next level.
   * @param {object} userProgress - The user's progress object.
   * @returns {boolean} True if the user should level up.
   */
  shouldLevelUp(userProgress) {
    const { currentLevel, correctAnswers, totalAnswers } = userProgress;
    if (currentLevel === 'advanced') return false;

    const accuracy = totalAnswers > 0 ? correctAnswers / totalAnswers : 0;
    const correctAnswersInLevel = userProgress.phraseHistory.filter(p => {
      // This requires linking phrase to its level, a future step.
      // For now, let's assume we need 50 correct answers and 85% accuracy.
      return p.correctAttempts > 0;
    }).length;

    if (correctAnswersInLevel > 50 && accuracy > 0.85) {
      // Logic to determine the *next* level would go here.
      return true;
    }
    return false;
  }
}

export default new ProgressTracker();
