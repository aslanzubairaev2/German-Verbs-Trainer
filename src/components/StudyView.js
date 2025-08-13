import React from 'react';
import { Volume2 } from 'lucide-react';
import VerbFormsDisplay from './VerbFormsDisplay';
import styles from './StudyView.module.css';

const StudyView = ({
  studyView,
  onStudyViewChange,
  pronouns,
  currentVerb,
  speak,
  speakFullPhrase,
  isSpeaking,
  handleFetchVerbForms,
}) => {
  const cx = (...args) => args.filter(Boolean).join(' ');

  return (
    <>
      <div className={styles.studyViewToggle}>
        <button
          onClick={() => onStudyViewChange("conjugation")}
          className={cx(studyView === "conjugation" && styles.active)}
        >
          Conjugation
        </button>
        <button
          onClick={() => onStudyViewChange("forms")}
          className={cx(studyView === "forms" && styles.active)}
        >
          Forms
        </button>
      </div>

      {studyView === "conjugation" ? (
        <div className={styles.tableContainer}>
          <table>
            <tbody>
              {pronouns.map((pronoun, index) => (
                <tr key={pronoun.german}>
                  <td className={styles.speakCell}>
                    <button
                      onClick={() => speakFullPhrase(index)}
                      disabled={isSpeaking}
                    >
                      <Volume2 />
                    </button>
                  </td>
                  <td className={styles.pronounCell}>
                    <span>{pronoun.german}</span>
                    <span
                      className={styles.pronounRussian}
                      style={{
                        display: "inline",
                        color: "#6b7280",
                        marginLeft: "0.5rem",
                        fontSize: "0.95em",
                      }}
                    >
                      ({pronoun.english})
                    </span>
                  </td>
                  <td className={styles.verbFormCell}>
                    <div>
                      <span>{currentVerb.forms[index]}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <VerbFormsDisplay
          verb={currentVerb}
          speak={speak}
          isSpeaking={isSpeaking}
          fetchVerbForms={handleFetchVerbForms}
        />
      )}
    </>
  );
};

export default StudyView;
