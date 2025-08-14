import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const SETTINGS_KEY = "phraseTrainerSettings";

const defaultSettings = {
  mode: "auto",
  pronouns: {
    ich: true,
    du: true,
    er_sie_es: true,
    wir: false,
    ihr: false,
    sie_Sie: false,
  },
  verbs: {
    common: true,
    irregular: false,
  },
  newPhrasesPerSession: 5,
};

const PhraseSettingsModal = ({ show, onClose, onSave }) => {
  const [mode, setMode] = useState(defaultSettings.mode);
  const [pronouns, setPronouns] = useState(defaultSettings.pronouns);
  const [verbs, setVerbs] = useState(defaultSettings.verbs);
  const [newPhrasesPerSession, setNewPhrasesPerSession] = useState(
    defaultSettings.newPhrasesPerSession
  );

  useEffect(() => {
    if (show) {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setMode(parsed.mode || defaultSettings.mode);
          setPronouns(parsed.pronouns || defaultSettings.pronouns);
          setVerbs(parsed.verbs || defaultSettings.verbs);
          setNewPhrasesPerSession(
            parsed.newPhrasesPerSession || defaultSettings.newPhrasesPerSession
          );
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    }
  }, [show]);

  const handleSave = () => {
    onSave({
      mode,
      pronouns,
      verbs,
      newPhrasesPerSession,
    });
    onClose();
  };

  if (!show) {
    return null;
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3>Настройки тренировки</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.body}>
          {/* Mode Selection */}
          <div style={styles.group}>
            <label style={styles.groupLabel}>Режим изучения:</label>
            <div>
              <input
                type="radio"
                id="auto"
                name="mode"
                value="auto"
                checked={mode === "auto"}
                onChange={() => setMode("auto")}
              />
              <label htmlFor="auto"> Автоматический</label>
            </div>
            <div>
              <input
                type="radio"
                id="custom"
                name="mode"
                value="custom"
                checked={mode === "custom"}
                onChange={() => setMode("custom")}
              />
              <label htmlFor="custom"> Настроить самому</label>
            </div>
          </div>

          {/* Custom Settings */}
          <div
            style={{
              ...styles.customSettings,
              opacity: mode === "custom" ? 1 : 0.5,
              pointerEvents: mode === "custom" ? "auto" : "none",
            }}
          >
            <div style={styles.group}>
              <label style={styles.groupLabel}>Местоимения:</label>
              <div style={styles.checkboxGrid}>
                {Object.keys(pronouns).map((key) => (
                  <div key={key}>
                    <input
                      type="checkbox"
                      id={key}
                      name={key}
                      checked={pronouns[key]}
                      onChange={() =>
                        setPronouns((p) => ({ ...p, [key]: !p[key] }))
                      }
                    />
                    <label htmlFor={key}>
                      {" "}
                      {key.replace("_", "/").replace("sie/Sie", "sie/Sie")}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.group}>
              <label style={styles.groupLabel}>Глаголы:</label>
              <div>
                <input
                  type="checkbox"
                  id="common"
                  name="common"
                  checked={verbs.common}
                  onChange={() =>
                    setVerbs((v) => ({ ...v, common: !v.common }))
                  }
                />
                <label htmlFor="common"> Частые</label>
              </div>
              <div>
                <input
                  type="checkbox"
                  id="irregular"
                  name="irregular"
                  checked={verbs.irregular}
                  onChange={() =>
                    setVerbs((v) => ({ ...v, irregular: !v.irregular }))
                  }
                />
                <label htmlFor="irregular"> Нерегулярные</label>
              </div>
            </div>
            <div style={styles.group}>
              <label htmlFor="newPhrases" style={styles.groupLabel}>
                Новых фраз за сессию: {newPhrasesPerSession}
              </label>
              <input
                type="range"
                id="newPhrases"
                name="newPhrases"
                min="1"
                max="20"
                value={newPhrasesPerSession}
                onChange={(e) =>
                  setNewPhrasesPerSession(parseInt(e.target.value, 10))
                }
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.buttonSecondary}>
            Отмена
          </button>
          <button onClick={handleSave} style={styles.buttonPrimary}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "1rem 1.5rem",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.25rem",
  },
  body: {
    padding: "1.5rem",
    maxHeight: "70vh",
    overflowY: "auto",
  },
  group: {
    marginBottom: "1.5rem",
  },
  groupLabel: {
    fontWeight: "600",
    display: "block",
    marginBottom: "0.5rem",
  },
  customSettings: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "1rem",
    marginTop: "1rem",
    transition: "opacity 0.3s ease",
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "0.5rem",
  },
  footer: {
    padding: "1rem 1.5rem",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
  },
  buttonPrimary: {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "6px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
  buttonSecondary: {
    padding: "0.5rem 1rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "white",
    color: "#374151",
    cursor: "pointer",
  },
};

export default PhraseSettingsModal;
