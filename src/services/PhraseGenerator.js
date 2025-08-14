import SpacedRepetition from './SpacedRepetition';
import { allVerbs } from '../data/verbs.js';
import { PRONOUNS } from '../data/pronouns.js';
import { SENTENCE_TEMPLATES } from '../data/sentence-templates.js';
import { PHRASES as staticPhrases } from '../phrases.js'; // Using old phrases as a temporary DB

// Temporary data until a proper database/CMS is implemented
const complements = {
  accusative_objects: ["das Buch", "den Ball", "einen Apfel", "Kaffee", "nichts"],
  places: ["nach Hause", "in die Schule", "in der Stadt", "hier", "dort"],
  time: ["heute", "morgen", "jeden Tag", "manchmal", "jetzt"],
};

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Service for generating phrases based on user progress and preferences.
 */
class PhraseGenerator {
  constructor() {
    // Create a map for quick phrase lookup by ID (using index as ID for now)
    this.phraseDB = new Map(staticPhrases.map((p, i) => [i.toString(), { ...p, id: i.toString() }]));
  }

  /**
   * Generates the next phrase for the user to practice.
   * It prioritizes reviews before generating new phrases.
   * @param {object} userProgress - The user's progress object.
   * @param {object} preferences - The user's current settings.
   * @returns {object|null} The next phrase object or null if none can be generated.
   */
  generateNext(userProgress, preferences) {
    // 1. Check for phrases due for review
    const reviewList = SpacedRepetition.getPhrasesForReview(userProgress);
    if (reviewList.length > 0) {
      const phraseToReview = this.phraseDB.get(reviewList[0].phraseId);
      if (phraseToReview) {
        // This is a review of an existing phrase
        return {
          ...phraseToReview,
          isReview: true,
        };
      }
    }

    // 2. If no reviews, generate a new phrase
    // This logic is simplified for now. A full implementation would be more robust.
    try {
      const level = userProgress.currentLevel || 'beginner'; // 'beginner', 'intermediate', 'advanced'

      // Select a verb (for now, any verb)
      const verb = getRandomElement(allVerbs);

      // Select a pronoun
      const pronounData = getRandomElement(PRONOUNS);
      const pronoun = pronounData.german;
      const pronounIndex = PRONOUNS.findIndex(p => p.german === pronoun);

      // Select a template (for now, simple statement)
      const template = getRandomElement(SENTENCE_TEMPLATES.statement_present);

      // Select a complement
      const complement = getRandomElement(complements.accusative_objects);

      // Assemble the phrase
      const conjugatedVerb = verb.forms[pronounIndex];
      let fullPhraseGerman = template
        .replace('{pronoun}', pronoun)
        .replace('{verb}', conjugatedVerb)
        .replace('{complement}', complement);

      // Basic Russian translation (placeholder)
      const fullPhraseRussian = `${pronounData.russian} ${verb.russian} ${complement}`;

      // Create a new phrase object
      const newPhrase = {
        id: `gen_${Date.now()}`, // Generated phrases get a unique ID
        templateId: 'statement_present',
        pronoun: pronoun,
        verb: verb,
        conjugatedVerb: conjugatedVerb,
        complement: complement,
        fullPhraseGerman: fullPhraseGerman.replace(' .', '.'),
        fullPhraseRussian: fullPhraseRussian,
        difficulty: 0.5, // This would be calculated by ProgressTracker
        category: 'generated',
        grammarFocus: ['conjugation', 'word_order'],
        isReview: false,
      };

      return newPhrase;
    } catch (error) {
      console.error("Failed to generate new phrase:", error);
      return null;
    }
  }

  /**
   * Generates a set of phrases based on custom filters. (Placeholder)
   * @param {object} filters - The custom filters from settings.
   * @returns {Array<object>} A list of custom-generated phrases.
   */
  generateCustomSet(filters) {
    console.log("Generating custom set with filters:", filters);
    // TODO: Implement custom set generation
    return [];
  }

  /**
   * Generates a set of phrases that are due for review.
   * @param {object} userProgress - The user's progress object.
   * @returns {Array<object>} A list of phrases to review.
   */
  generateReviewSet(userProgress) {
    const reviewList = SpacedRepetition.getPhrasesForReview(userProgress);
    return reviewList.map(item => this.phraseDB.get(item.phraseId)).filter(Boolean);
  }

  /**
   * Validates a user's answer against the correct phrase.
   * @param {string} userAnswer - The answer provided by the user.
   * @param {string} correctAnswer - The correct German phrase.
   * @returns {boolean} True if the answer is correct.
   */
  validatePhrase(userAnswer, correctAnswer) {
    if (typeof userAnswer !== 'string' || typeof correctAnswer !== 'string') {
      return false;
    }
    // Simple validation: case-insensitive and trim whitespace.
    // More advanced validation could handle punctuation, etc.
    return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  }
}

export default new PhraseGenerator();
