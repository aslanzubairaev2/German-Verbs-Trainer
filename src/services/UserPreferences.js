/**
 * Service for managing user preferences.
 * As defined in the technical specification (4.1).
 */
class UserPreferences {
  constructor(storageKey = 'userPreferences') {
    this.storageKey = storageKey;
  }

  load() {
    try {
      const storedPrefs = localStorage.getItem(this.storageKey);
      return storedPrefs ? JSON.parse(storedPrefs) : this.getDefaults();
    } catch (error) {
      console.error("Failed to load user preferences:", error);
      return this.getDefaults();
    }
  }

  save(preferences) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(preferences));
    } catch (error) {
      console.error("Failed to save user preferences:", error);
    }
  }

  getDefaults() {
    return {
      learningMode: 'program', // 'program' | 'custom'
      selectedPronouns: ['ich', 'du', 'er/sie/es'],
      selectedVerbs: [], // or some default list
      sentenceTypes: ['statement'],
      difficulty: 'auto', // 'auto' | 'manual'
    };
  }
}

export default new UserPreferences();
