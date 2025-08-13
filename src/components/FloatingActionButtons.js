import React from 'react';
import { HelpCircle, Sparkles, Mic } from 'lucide-react';
import styles from './FloatingActionButtons.module.css';

const FloatingActionButtons = ({
  onShowGeminiInfo,
  onShowVerbChat,
  onVoicePickVerb,
  isListening,
}) => {
  const cx = (...args) => args.filter(Boolean).join(' ');

  return (
    <div className={styles.fabRoot}>
      <div className={styles.fabContainer}>
        <button
          onClick={onShowGeminiInfo}
          title="Verb Info"
          className={cx(styles.fabButton, styles.geminiFab)}
        >
          <HelpCircle />
        </button>
        <button
          onClick={onShowVerbChat}
          title="Verb Chat"
          className={cx(styles.fabButton, styles.speakFab)}
        >
          <Sparkles />
        </button>
        <button
          onClick={onVoicePickVerb}
          title={
            isListening ? "Stop listening" : "Voice verb selection"
          }
          className={cx(styles.fabButton, styles.speakFab)}
          style={{ backgroundColor: isListening ? "#ef4444" : "" }}
        >
          <Mic />
        </button>
      </div>
    </div>
  );
};

export default FloatingActionButtons;
