import React from 'react';
import { List, Settings, Home } from 'lucide-react';
import styles from './AppHeader.module.css';

const AppHeader = ({
  currentLevel,
  practiceMode,
  onToggleMode,
  onShowVerbList,
  onShowSettings,
  onGoHome,
}) => {
  // Helper to build class names. A simple version of the 'classnames' library.
  const cx = (...args) => args.filter(Boolean).join(' ');

  const levelClass = styles[`level${currentLevel}`] || styles.levelA1;

  return (
    <header className={styles.appHeader}>
      <div className={cx(styles.levelBadge, levelClass)}>
        {currentLevel}
      </div>
      <div className={styles.modeToggle}>
        <div className={styles.toggleGroup}>
          <button
            onClick={() => onToggleMode(false)}
            className={cx(
              styles.toggleButton,
              !practiceMode && styles.active,
              !practiceMode && styles.study
            )}
          >
            Study
          </button>
          <button
            onClick={() => onToggleMode(true)}
            className={cx(
              styles.toggleButton,
              practiceMode && styles.active,
              practiceMode && styles.practice
            )}
          >
            Practice
          </button>
        </div>
      </div>
      <div className={styles.headerIcons}>
        <button
          onClick={onShowVerbList}
          title="Verb List"
          className={styles.headerIconBtn}
        >
          <List />
        </button>
        <button
          onClick={onShowSettings}
          title="Settings"
          className={styles.headerIconBtn}
        >
          <Settings />
        </button>
        <button
          onClick={onGoHome}
          title="Go Home"
          className={styles.headerIconBtn}
        >
          <Home />
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
