import { useState, useCallback } from 'react';
import UserPreferences from '../services/UserPreferences';

/**
 * Custom hook for managing user settings.
 */
const useSettings = () => {
  const [settings, setSettings] = useState(() => UserPreferences.load());

  const saveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    UserPreferences.save(newSettings);
  }, []);

  return { settings, saveSettings };
};

export default useSettings;
