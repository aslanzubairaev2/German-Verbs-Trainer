/**
 * Service for managing the spaced repetition algorithm (based on a simplified SM-2).
 */
class SpacedRepetition {
  /**
   * Updates a phrase's repetition data based on user performance.
   * @param {object} phraseItem - The phrase object from the user's history.
   * @param {boolean} isCorrect - If the user's answer was correct.
   * @returns {object} The updated phrase item.
   */
  updateRepetitionData(phraseItem, isCorrect) {
    let { repetitions, easinessFactor, interval } = phraseItem;

    if (isCorrect) {
      // Correct answer: increase interval
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.ceil(interval * easinessFactor);
      }
      repetitions += 1;
      // The easiness factor is adjusted based on performance.
      // A simple formula: EF' = EF + [0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)]
      // where q is response quality (0-5). We'll simplify this for now.
      // For a correct answer, we'll assume a quality of 4.
      easinessFactor = easinessFactor + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02));
    } else {
      // Incorrect answer: reset progress
      repetitions = 0;
      interval = 1;
      // Lower the easiness factor, making it appear more frequently.
      // Assume a quality of 0 for an incorrect answer.
      easinessFactor = easinessFactor + (0.1 - (5 - 0) * (0.08 + (5 - 0) * 0.02));
    }

    // Clamp easiness factor to its minimum value.
    if (easinessFactor < 1.3) {
      easinessFactor = 1.3;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
      ...phraseItem,
      repetitions,
      easinessFactor,
      interval,
      nextReview: nextReviewDate.toISOString(),
      lastAttempt: new Date().toISOString(),
    };
  }

  /**
   * Filters a user's phrase history to find items due for review.
   * @param {object} userProgress - The user's progress object.
   * @returns {Array<object>} A list of phrase items that are due for review.
   */
  getPhrasesForReview(userProgress) {
    if (!userProgress || !userProgress.phraseHistory) {
      return [];
    }

    const now = new Date();
    return userProgress.phraseHistory.filter(phrase => {
      if (!phrase.nextReview) return false;
      const nextReviewDate = new Date(phrase.nextReview);
      return nextReviewDate <= now;
    });
  }

  /**
   * Calculates the next review date without modifying the item.
   * This is a helper that can be used for projections.
   * The main logic is in updateRepetitionData.
   * @param {object} phraseItem - The phrase object from the user's history.
   * @param {boolean} isCorrect - If the user's answer was correct.
   * @returns {Date} The calculated next review date.
   */
  calculateNextReview(phraseItem, isCorrect) {
    const updatedItem = this.updateRepetitionData(phraseItem, isCorrect);
    return new Date(updatedItem.nextReview);
  }
}

export default new SpacedRepetition();
