import React, { useState } from "react";
import { X, Settings, HelpCircle, Volume2, AlertTriangle } from "lucide-react";
import styles from './SettingsModal.module.css';

const SettingsModal = ({
  show,
  onClose,
  autoPlay,
  setAutoPlay,
  onResetProgress,
}) => {
  const [activeTab, setActiveTab] = useState("settings");
  const [confirmReset, setConfirmReset] = useState(false);
  const cx = (...args) => args.filter(Boolean).join(' ');

  const handleReset = () => {
    onResetProgress();
    onClose();
  };

  if (!show) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.modalCloseBtn}>
          <X />
        </button>
        <div className={styles.settingsTabs}>
          <button
            className={cx(activeTab === "settings" && styles.active)}
            onClick={() => setActiveTab("settings")}
          >
            <Settings /> Settings
          </button>
          <button
            className={cx(activeTab === "info" && styles.active)}
            onClick={() => setActiveTab("info")}
          >
            <HelpCircle /> Help
          </button>
        </div>
        <div className={styles.modalBodyContainer}>
          {activeTab === "settings" && (
            <>
              <div className={styles.settingsRow}>
                <span>Auto-play audio</span>
                <button
                  onClick={() => setAutoPlay(!autoPlay)}
                  className={cx(styles.toggleBtn, autoPlay ? styles.on : styles.off)}
                >
                  {autoPlay ? <Volume2 /> : <X />}
                  <span>{autoPlay ? "On" : "Off"}</span>
                </button>
              </div>
              <div className={styles.resetSection}>
                <h4>Reset Progress</h4>
                <p>
                  This action will delete all data about completed verbs and
                  unlocked levels.
                </p>
                {!confirmReset ? (
                  <button
                    className={styles.resetBtnInitial}
                    onClick={() => setConfirmReset(true)}
                  >
                    Reset all progress
                  </button>
                ) : (
                  <div className={styles.resetConfirm}>
                    <p>Are you sure?</p>
                    <button
                      className={styles.resetBtnCancel}
                      onClick={() => setConfirmReset(false)}
                    >
                      Cancel
                    </button>
                    <button className={styles.resetBtnConfirm} onClick={handleReset}>
                      <AlertTriangle size={16} /> Yes, reset
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {activeTab === "info" && (
            <div className={styles.infoTab}>
              <h4>Basics of Verb Conjugation</h4>
              <p>
                In German, like in English, verbs change their form
                depending on who is performing the action (person) and when
                (tense). This process is called <strong>conjugation</strong>.
              </p>
              <h5>Verb Types:</h5>
              <ul>
                <li>
                  <strong>Weak (regular):</strong> The simplest group.
                  They are conjugated according to clear rules, adding standard
                  endings to the verb stem. Example:{" "}
                  <em>
                    machen (to do) -&gt; ich mach<strong>e</strong>, du mach
                    <strong>st</strong>
                  </em>
                  .
                </li>
                <li>
                  <strong>Strong (irregular):</strong> These verbs do not
                  follow the general rules. Their root vowel often
                  changes during conjugation. Example:{" "}
                  <em>
                    sprechen (to speak) -&gt; ich spreche, du spr
                    <strong>i</strong>chst
                  </em>
                  . Their forms need to be memorized.
                </li>
                <li>
                  <strong>Mixed:</strong> A rare group that behaves
                  like weak verbs (taking their endings) but also changes
                  the root vowel like strong verbs. Example:{" "}
                  <em>denken (to think) -&gt; ich dachte (in the past tense)</em>.
                </li>
              </ul>
              <h5>Standard Endings (for weak verbs):</h5>
              <table>
                <tbody>
                  <tr>
                    <td>ich (I)</td>
                    <td>-e</td>
                  </tr>
                  <tr>
                    <td>du (you)</td>
                    <td>-st</td>
                  </tr>
                  <tr>
                    <td>er/sie/es (he/she/it)</td>
                    <td>-t</td>
                  </tr>
                  <tr>
                    <td>wir (we)</td>
                    <td>-en</td>
                  </tr>
                  <tr>
                    <td>ihr (you, pl.)</td>
                    <td>-t</td>
                  </tr>
                  <tr>
                    <td>sie/Sie (they/You)</td>
                    <td>-en</td>
                  </tr>
                </tbody>
              </table>
              <p>
                This trainer will help you practice and memorize the forms of the most
                important verbs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
