/**
 * Data model for user progress, based on the technical specification (4.2.1).
 * This defines the shape of the user progress object.
 */
export const UserProgressModel = {
  id: 'user_id',
  currentLevel: 'beginner', // 'beginner'|'intermediate'|'advanced'
  totalSessions: 0,
  totalAnswers: 0,
  correctAnswers: 0,
  currentStreak: 0,
  longestStreak: 0,
  weakAreas: [], // e.g., ['Perfekt', 'separable_verbs']
  strongAreas: [],
  preferences: {
    learningMode: 'program', // 'program'|'custom'
    selectedPronouns: [],
    selectedVerbs: [],
    sentenceTypes: [],
    difficulty: 'auto' // 'auto'|'manual'
  },
  phraseHistory: []
};
