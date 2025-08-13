import React from "react";
import styles from './StartScreen.module.css';

/**
 * Initial welcome screen component.
 * It is displayed until the audio is activated (audioReady === false).
 * When a button is clicked, it calls onStart or onStartCurriculum.
 */
function StartScreen({ onStart, onStartCurriculum }) {
  return (
    <div className={styles.startScreen}>
      <div className={styles.cardsContainer}>
        {/* Card: Verb Practice */}
        <div className={`${styles.startCard} ${styles.cardVerbs}`}>
          <h2>Verb Practice</h2>
          <p>Learn German verb conjugations and forms simply and conveniently.</p>
          <button className={styles.btnVerbs} onClick={onStart}>
            Start
          </button>
        </div>
        {/* Card: Learn with a curriculum */}
        <div className={`${styles.startCard} ${styles.cardCurriculum}`}>
          <h2>Learn with a Curriculum</h2>
          <p>A personalized program: simple AI-powered phrases for your level.</p>
          <button className={styles.btnCurriculum} onClick={onStartCurriculum}>
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

export default StartScreen;
