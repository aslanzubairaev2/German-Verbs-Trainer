import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getVerbTypeLabel } from "../constants";
import styles from './VerbNavigation.module.css';

const VerbNavigation = ({ onPreviousVerb, onNextVerb, currentVerb }) => {
  return (
    <div className={styles.verbNavigation}>
      <button onClick={onPreviousVerb} className={styles.navBtn}>
        <ChevronLeft />
      </button>
      <div className={styles.verbDisplay}>
        <h2>
          {currentVerb.infinitive
            ? currentVerb.infinitive.charAt(0).toUpperCase() +
              currentVerb.infinitive.slice(1)
            : ""}
        </h2>
        <p>{currentVerb.russian}</p>
        <div
          style={{
            fontSize: "0.8rem",
            color: "#64748b",
            marginTop: "0.25rem",
          }}
        >
          {getVerbTypeLabel(currentVerb.type)}
        </div>
      </div>
      <button onClick={onNextVerb} className={styles.navBtn}>
        <ChevronRight />
      </button>
    </div>
  );
};

export default VerbNavigation;
