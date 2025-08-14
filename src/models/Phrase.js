/**
 * Data model for a phrase, based on the technical specification (4.2.2).
 * This defines the shape of a phrase object used in the application.
 */
export const PhraseModel = {
  id: 'unique_id',
  templateId: 'template_id',
  pronoun: 'ich', // 'ich'|'du'|'er'|'sie'|'es'|'wir'|'ihr'|'sie'
  verb: {
    infinitive: 'string',
    // ... other verb properties
  },
  conjugatedVerb: 'string',
  complement: 'string', // The rest of the sentence
  fullPhraseGerman: 'string',
  fullPhraseRussian: 'string',
  difficulty: 0.5, // 0.0-1.0
  category: 'daily', // 'daily'|'business'|'travel'|etc.
  grammarFocus: ['conjugation', 'word_order'], // 'conjugation'|'word_order'|etc.
  metadata: {
    createdAt: null, // Date
    usageCount: 0,
    averageAccuracy: 0.5, // 0.0-1.0
  }
};
