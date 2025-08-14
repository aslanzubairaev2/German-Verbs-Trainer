import { useState, useCallback } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { UserProgressModel } from '../models/UserProgress';

const PROGRESS_STORAGE_KEY = 'userProgressData_v2'; // New key for the new structure

/**
 * Custom hook for managing user progress.
 * It loads from localStorage on init and saves on every update.
 * @param {string} userId - The ID of the current user.
 */
const useProgress = (userId) => {
  const storageKey = `${PROGRESS_STORAGE_KEY}_${userId}`;

  const [progress, setProgress] = useState(() => {
    const savedProgress = loadFromStorage(storageKey);
    if (savedProgress) {
      return savedProgress;
    }
    // Return a copy of the model for a new user, with the correct ID.
    return { ...UserProgressModel, id: userId };
  });

  /**
   * A function to update the progress state and persist it to localStorage.
   */
  const updateAndSaveProgress = useCallback((newProgress) => {
    setProgress(newProgress);
    saveToStorage(storageKey, newProgress);
  }, [storageKey]);

  // The hook returns the current progress state and the function to update it.
  // The component was refactored to use `setProgress`, so we'll name it that.
  return { progress, setProgress: updateAndSaveProgress };
};

export default useProgress;
