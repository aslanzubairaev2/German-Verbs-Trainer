import { useState, useEffect } from 'react';
import { LEVEL_ORDER } from '../constants';

const initialAppState = {
  unlockedLevels: ["A1"],
  levelProgress: LEVEL_ORDER.reduce(
    (acc, level) => ({
      ...acc,
      [level]: { correct: 0, total: 0, uniqueVerbs: [] },
    }),
    {}
  ),
  masteredVerbs: [],
  lastVerbIndex: 0,
};

function loadState() {
  try {
    const savedState = localStorage.getItem("germanVerbsState");
    return savedState
      ? { ...initialAppState, ...JSON.parse(savedState) }
      : initialAppState;
  } catch (error) {
    console.error("Failed to parse state from localStorage", error);
    return initialAppState;
  }
}

export function useAppProgress() {
  const [appState, setAppState] = useState(loadState);

  useEffect(() => {
    localStorage.setItem("germanVerbsState", JSON.stringify(appState));
  }, [appState]);

  const setLastVerbIndex = (index) => {
    setAppState(prev => ({ ...prev, lastVerbIndex: index }));
  };

  return { appState, setAppState, setLastVerbIndex };
}
