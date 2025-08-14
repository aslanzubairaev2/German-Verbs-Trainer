/**
 * Utility functions for verb conjugation.
 */

/**
 * Conjugates a verb for a given pronoun.
 * This will be a complex function that needs access to verb data.
 * @param {object} verb - The verb object from data/verbs.js
 * @param {string} pronoun - The pronoun (e.g., 'ich', 'du')
 * @param {string} tense - The tense (e.g., 'Präsens', 'Perfekt')
 * @returns {string} The conjugated verb form.
 */
export function conjugate(verb, pronoun, tense) {
  // Placeholder logic
  console.log(`Conjugating ${verb.infinitive} for ${pronoun} in ${tense}`);
  // In a real implementation, this would look up conjugation rules.
  return verb.infinitive;
}

/**
 * Finds the correct auxiliary verb (haben or sein) for the Perfekt tense.
 * @param {object} verb - The verb object.
 * @returns {string} 'haben' or 'sein'.
 */
export function getAuxiliaryVerb(verb) {
  // Placeholder
  return verb.auxiliary || 'haben';
}
