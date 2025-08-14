/**
 * Defines the parameters for each difficulty level.
 * Based on the technical specification (3.1.2).
 */
export const DIFFICULTY_LEVELS = {
  BEGINNER: {
    level: 'A1',
    pronouns: ['ich', 'du', 'er/sie/es'],
    // Verbs will be filtered by a 'top50_regular' tag or similar logic
    verbTypes: ['regular'],
    structures: ['statement'],
    tenses: ['Präsens'],
  },
  INTERMEDIATE: {
    level: 'A2',
    pronouns: ['wir', 'ihr', 'sie/Sie'],
    verbTypes: ['irregular', 'separable'],
    structures: ['question', 'negation'],
    tenses: ['Präsens', 'Perfekt'],
  },
  ADVANCED: {
    level: 'B1',
    pronouns: ['all_reflexive'], // 'all' and reflexive pronouns
    verbTypes: ['modal', 'subjunctive'],
    structures: ['complex_subordinate'], // Represents complex sentences
    tenses: ['all'], // Represents all available tenses
  },
};

/**
 * Defines the weights for calculating phrase difficulty.
 * Based on the technical specification (6.2).
 */
export const DIFFICULTY_WEIGHTS = {
  pronouns: {
    'ich': 0.1, 'du': 0.2, 'er': 0.3, 'sie': 0.3, 'es': 0.3,
    'wir': 0.5, 'ihr': 0.6, 'sie/Sie': 0.7
  },
  verbTypes: {
    'regular': 0.2,
    'irregular': 0.6,
    'separable': 0.7,
    'modal': 0.9
  },
  sentenceTypes: {
    'statement': 0.1,
    'question': 0.4,
    'negation': 0.5,
    'w_question': 0.6
  }
};
