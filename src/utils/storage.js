/**
 * Generic utility functions for interacting with localStorage.
 */

/**
 * Loads data from localStorage and parses it as JSON.
 * @param {string} key - The key to load from localStorage.
 * @param {*} defaultValue - The value to return if the key is not found or parsing fails.
 * @returns {any} The parsed data or the default value.
 */
export function loadFromStorage(key, defaultValue = null) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : defaultValue;
  } catch (error) {
    console.error(`Failed to load '${key}' from storage:`, error);
    return defaultValue;
  }
}

/**
 * Saves data to localStorage after converting it to a JSON string.
 * @param {string} key - The key to save to localStorage.
 * @param {any} value - The value to save.
 */
export function saveToStorage(key, value) {
  try {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
  } catch (error) {
    console.error(`Failed to save '${key}' to storage:`, error);
  }
}
