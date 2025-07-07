import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Volume2,
  Settings,
  Sparkles,
  LoaderCircle,
  Unlock,
  HelpCircle,
  Lightbulb,
  List,
  Search,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { allVerbs } from "./verbsData.js"; // <-- ВАШ ФАЙЛ С ГЛАГОЛАМИ ПОДКЛЮЧЕН ЗДЕСЬ
import VerbListModal from "./components/VerbListModal.js";
import SettingsModal from "./components/SettingsModal.js";
import GeminiInfoModal from "./components/GeminiInfoModal.js";
import LevelUpToast from "./components/LevelUpToast.js";
import VerbFormsDisplay from "./components/VerbFormsDisplay.js";
import { pronouns, LEVEL_ORDER, LEVEL_UP_REQUIREMENTS } from "./constants";
import { fetchGeminiInfo, fetchVerbForms } from "./api/gemini";

// --- ОСНОВНЫЕ ДАННЫЕ ---

// --- ОСНОВНОЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ ---
function GermanVerbsApp() {
  // --- STATE ---
  const [appState, setAppState] = useState(() => {
    try {
      const savedState = localStorage.getItem("germanVerbsState");
      const initialState = {
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
      return savedState
        ? { ...initialState, ...JSON.parse(savedState) }
        : initialState;
    } catch (error) {
      console.error("Failed to parse state from localStorage", error);
      return {
        unlockedLevels: ["A1"],
        levelProgress: {},
        masteredVerbs: [],
        lastVerbIndex: 0,
      };
    }
  });

  const [practiceMode, setPracticeMode] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [currentPronoun, setCurrentPronoun] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showVerbList, setShowVerbList] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState("");
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [geminiDataCache, setGeminiDataCache] = useState({});
  const [verbFormsCache, setVerbFormsCache] = useState({}); // <-- Кэш для новых форм
  const [studyView, setStudyView] = useState("conjugation"); // 'conjugation' или 'forms'

  // --- DERIVED STATE & MEMOS ---
  const availableVerbsForProgression = useMemo(
    () =>
      allVerbs.filter((verb) => appState.unlockedLevels.includes(verb.level)),
    [appState.unlockedLevels]
  );
  const currentVerb = allVerbs[appState.lastVerbIndex];
  const currentLevel =
    appState.unlockedLevels[appState.unlockedLevels.length - 1];

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem("germanVerbsState", JSON.stringify(appState));
  }, [appState]);

  useEffect(() => {
    // Сбрасываем вид при смене режима
    setStudyView("conjugation");
  }, [practiceMode]);

  // --- API & AUDIO ---
  const speak = useCallback(
    (text, lang = "de-DE") => {
      if (!audioReady || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [audioReady]
  );

  // --- LOGIC ---
  const speakFullPhrase = (pronounIndex) => {
    const pronoun = pronouns[pronounIndex];
    const verbForm = currentVerb.forms[pronounIndex];
    speak(`${pronoun.base || pronoun.german} ${verbForm}`);
  };

  const checkLevelUp = useCallback(
    (level) => {
      const progress = appState.levelProgress[level];
      const nextLevelIndex = LEVEL_ORDER.indexOf(level) + 1;
      if (
        nextLevelIndex >= LEVEL_ORDER.length ||
        appState.unlockedLevels.includes(LEVEL_ORDER[nextLevelIndex])
      )
        return;

      const accuracy =
        progress.total > 0 ? progress.correct / progress.total : 0;

      if (
        progress.uniqueVerbs.length >= LEVEL_UP_REQUIREMENTS.correctAnswers &&
        accuracy >= LEVEL_UP_REQUIREMENTS.accuracy
      ) {
        setAppState((prev) => ({
          ...prev,
          unlockedLevels: [...prev.unlockedLevels, LEVEL_ORDER[nextLevelIndex]],
        }));
        setLevelUpMessage(
          `Поздравляем! Вы открыли уровень ${LEVEL_ORDER[nextLevelIndex]}!`
        );
        setTimeout(() => setLevelUpMessage(""), 5000);
      }
    },
    [appState.levelProgress, appState.unlockedLevels]
  );

  const checkAnswer = () => {
    const correctAnswer = currentVerb.forms[currentPronoun];
    const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer;

    if (isCorrect) {
      setFeedback("Правильно! ✓");
      speakFullPhrase(currentPronoun);

      if (!hintUsed) {
        const newMasterySet = new Set(appState.masteredVerbs).add(
          currentVerb.infinitive
        );
        if (newMasterySet.size > appState.masteredVerbs.length) {
          setAppState((prev) => ({
            ...prev,
            masteredVerbs: [...newMasterySet],
          }));
        }
      }

      const verbLevel = currentVerb.level;
      setAppState((prev) => {
        const newProgress = { ...prev.levelProgress };
        newProgress[verbLevel].correct += 1;
        newProgress[verbLevel].total += 1;
        if (
          !newProgress[verbLevel].uniqueVerbs.includes(currentVerb.infinitive)
        ) {
          newProgress[verbLevel].uniqueVerbs.push(currentVerb.infinitive);
        }
        checkLevelUp(verbLevel);
        return { ...prev, levelProgress: newProgress };
      });

      setTimeout(() => {
        setFeedback("");
        setShowHint(false);
        const nextPronounIndex = (currentPronoun + 1) % pronouns.length;
        setCurrentPronoun(nextPronounIndex);
        setUserAnswer("");
      }, 1500);
    } else {
      setFeedback(`Неверно. Правильный ответ: ${correctAnswer}`);
      const verbLevel = currentVerb.level;
      setAppState((prev) => {
        const newProgress = { ...prev.levelProgress };
        newProgress[verbLevel].total += 1;
        if (
          !newProgress[verbLevel].uniqueVerbs.includes(currentVerb.infinitive)
        ) {
          newProgress[verbLevel].uniqueVerbs.push(currentVerb.infinitive);
        }
        checkLevelUp(verbLevel);
        return { ...prev, levelProgress: newProgress };
      });
    }
  };

  const handleHint = () => {
    setShowHint(true);
    setHintUsed(true);
  };

  const resetVerbState = () => {
    setUserAnswer("");
    setFeedback("");
    setCurrentPronoun(0);
    setHintUsed(false);
    setShowHint(false);
  };

  const selectVerb = (verb) => {
    const verbIndex = allVerbs.findIndex(
      (v) => v.infinitive === verb.infinitive
    );
    if (verbIndex !== -1) {
      setAppState((prev) => ({ ...prev, lastVerbIndex: verbIndex }));
      setPracticeMode(false);
      resetVerbState();
      setShowVerbList(false);
    }
  };

  const resetAllProgress = () => {
    localStorage.removeItem("germanVerbsState");
    window.location.reload();
  };

  const changeVerb = (direction) => {
    const currentIndexInAvailable = availableVerbsForProgression.findIndex(
      (v) => v.infinitive === currentVerb.infinitive
    );
    let nextIndexInAvailable;

    if (direction === 1) {
      nextIndexInAvailable =
        (currentIndexInAvailable + 1) % availableVerbsForProgression.length;
    } else {
      nextIndexInAvailable =
        (currentIndexInAvailable - 1 + availableVerbsForProgression.length) %
        availableVerbsForProgression.length;
    }

    const nextVerbInfinitive =
      availableVerbsForProgression[nextIndexInAvailable].infinitive;
    const newMasterIndex = allVerbs.findIndex(
      (v) => v.infinitive === nextVerbInfinitive
    );

    setAppState((prev) => ({ ...prev, lastVerbIndex: newMasterIndex }));
    resetVerbState();
    if (autoPlay) {
      setTimeout(() => speak(allVerbs[newMasterIndex].infinitive), 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && userAnswer.trim()) checkAnswer();
  };

  // Обёртка для передачи в VerbFormsDisplay
  const handleFetchVerbForms = (verb, pronoun, setter) => {
    fetchVerbForms({
      verb,
      pronoun,
      verbFormsCache,
      setVerbFormsCache,
      setter,
    });
  };

  // Обёртка для передачи в GeminiInfoModal
  const handleFetchGeminiInfo = (verb, setter, force) => {
    fetchGeminiInfo({ verb, geminiDataCache, setGeminiDataCache, setter, force });
  };

  // --- RENDER ---
  if (!audioReady) {
    return (
      <div className="start-screen">
        <div className="start-box">
          <h1>Тренажер немецких глаголов</h1>
          <p>Нажмите, чтобы начать и активировать звук.</p>
          <button onClick={() => setAudioReady(true)}>Начать</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <LevelUpToast
        message={levelUpMessage}
        onDismiss={() => setLevelUpMessage("")}
      />
      <GeminiInfoModal
        key={currentVerb.infinitive}
        show={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
        verb={currentVerb}
        onFetch={handleFetchGeminiInfo}
        speak={speak}
        isSpeaking={isSpeaking}
      />
      <VerbListModal
        show={showVerbList}
        onClose={() => setShowVerbList(false)}
        onSelectVerb={selectVerb}
        verbs={allVerbs}
        masteredVerbs={appState.masteredVerbs}
      />
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        autoPlay={autoPlay}
        setAutoPlay={setAutoPlay}
        onResetProgress={resetAllProgress}
      />

      <div className="app-container">
        <div className="main-card">
          <div className="main-card-header">
            <header className="app-header">
              <div
                className={`level-badge level-${currentLevel.toLowerCase()}`}
              >
                {currentLevel}
              </div>
              <div className="mode-toggle">
                <div className="toggle-group">
                  <button
                    onClick={() => setPracticeMode(false)}
                    className={!practiceMode ? "active" : ""}
                  >
                    Изучение
                  </button>
                  <button
                    onClick={() => setPracticeMode(true)}
                    className={practiceMode ? "active" : ""}
                  >
                    Практика
                  </button>
                </div>
              </div>
              <div className="header-icons">
                <button
                  onClick={() => setShowVerbList(true)}
                  title="Список глаголов"
                  className="header-icon-btn"
                >
                  <List />
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  title="Настройки"
                  className="header-icon-btn"
                >
                  <Settings />
                </button>
              </div>
            </header>

            <div className="verb-navigation">
              <button onClick={() => changeVerb(-1)} className="nav-btn">
                <ChevronLeft />
              </button>
              <div className="verb-display">
                <h2>{currentVerb.infinitive}</h2>
                <p>{currentVerb.russian}</p>
              </div>
              <button onClick={() => changeVerb(1)} className="nav-btn">
                <ChevronRight />
              </button>
            </div>
          </div>

          <div className="main-card-body">
            {practiceMode ? (
              <div className="practice-box">
                <div className="practice-prompt">
                  <p>
                    Как спрягается <strong>{currentVerb.infinitive}</strong> с
                    местоимением{" "}
                    <strong>{pronouns[currentPronoun].german}</strong>?
                  </p>
                </div>
                <div className="practice-input-group">
                  <span>{pronouns[currentPronoun].german}</span>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Форма глагола"
                    autoFocus
                  />
                  <button onClick={checkAnswer} disabled={!userAnswer.trim()}>
                    <Check />
                  </button>
                </div>
                {feedback && (
                  <div
                    className={`feedback-box ${
                      feedback.includes("Правильно") ? "correct" : "incorrect"
                    }`}
                  >
                    {feedback}
                  </div>
                )}
                <div className="hint-container">
                  {showHint ? (
                    <div className="hint-box">
                      {pronouns[currentPronoun].german}{" "}
                      {currentVerb.forms[currentPronoun]}
                    </div>
                  ) : (
                    <button
                      className="hint-btn"
                      onClick={handleHint}
                      title="Показать подсказку"
                    >
                      <Lightbulb size={20} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="study-view-toggle">
                  <button
                    onClick={() => setStudyView("conjugation")}
                    className={studyView === "conjugation" ? "active" : ""}
                  >
                    Спряжение
                  </button>
                  <button
                    onClick={() => setStudyView("forms")}
                    className={studyView === "forms" ? "active" : ""}
                  >
                    Формы
                  </button>
                </div>

                {studyView === "conjugation" ? (
                  <div className="table-container">
                    <table>
                      <tbody>
                        {pronouns.map((pronoun, index) => (
                          <tr key={pronoun.german}>
                            <td className="speak-cell">
                              <button
                                onClick={() => speakFullPhrase(index)}
                                disabled={isSpeaking}
                              >
                                <Volume2 />
                              </button>
                            </td>
                            <td className="pronoun-cell">
                              <span>{pronoun.german}</span>
                              {/* 
                                Перевод местоимения теперь всегда виден.
                                Убрали скрытие через CSS для .pronoun-russian.
                                Если нужно скрывать только на очень маленьких экранах, используйте media query с меньшей шириной.
                              */}
                              <span
                                className="pronoun-russian"
                                style={{
                                  display: "inline",
                                  color: "#6b7280", // var(--gray-500)
                                  marginLeft: "0.5rem",
                                  fontSize: "0.95em"
                                }}
                              >
                                ({pronoun.russian})
                              </span>
                            </td>
                            <td className="verb-form-cell">
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
            )}
          </div>
        </div>
      </div>

      <div className="fab-container">
        <button
          onClick={() => speak(currentVerb.infinitive)}
          disabled={isSpeaking}
          className="fab-button speak-fab"
        >
          <Volume2 />
        </button>
        <button
          onClick={() => setShowGeminiModal(true)}
          title="Узнать больше"
          className="fab-button gemini-fab"
        >
          <Sparkles />
        </button>
      </div>
      {/* Стили возвращены для восстановления дизайна */}
      <style>{`
                /* --- Глобальные переменные и базовые стили (для всего приложения) --- */
                :root {
                    --blue-50: #eff6ff; --blue-100: #dbeafe; --blue-600: #2563eb; --blue-700: #1d4ed8;
                    --green-50: #f0fdf4; --green-100: #dcfce7; --green-500: #22c55e; --green-600: #16a34a; --green-800: #166534;
                    --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-200: #e5e7eb; --gray-400: #9ca3af; --gray-500: #6b7280; --gray-800: #1f2937; --gray-900: #111827;
                    --indigo-100: #e0e7ff; --yellow-100: #fef9c3; --red-100: #fee2e2; --red-500: #ef4444; --red-700: #b91c1c;
                    --purple-500: #a855f7; --white: #ffffff; --black-t60: rgba(0, 0, 0, 0.6);
                    --orange-400: #fb923c; --amber-400: #facc15; --lime-400: #a3e63e; --cyan-400: #22d3ee;
                    --gold-100: #FEF3C7; --gold-600: #D97706;
                    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                }

                body {
                    margin: 0;
                    font-family: var(--font-sans);
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    background-color: var(--blue-50);
                }

                button {
                    font-family: inherit;
                    cursor: pointer;
                    border: none;
                    background-color: transparent;
                    padding: 0;
                    transition: all 0.2s ease-in-out;
                }
                button:disabled { cursor: not-allowed; opacity: 0.5; }

                /* --- Стартовый экран (StartScreen) --- */
                .start-screen {
                    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
                    background: linear-gradient(to bottom right, var(--blue-100), var(--indigo-100));
                }
                .start-box {
                    text-align: center; padding: 2rem; background-color: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(4px); border-radius: 1rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    max-width: 400px; margin: 1rem;
                }
                .start-box h1 { font-size: 2rem; color: var(--gray-800); margin-bottom: 1rem; }
                .start-box p { color: var(--gray-500); margin-bottom: 2rem; }
                .start-box button {
                    padding: 0.75rem 2rem; background-color: var(--blue-600); color: var(--white);
                    border-radius: 0.75rem; font-size: 1.125rem; font-weight: 600;
                    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
                }
                .start-box button:hover { background-color: var(--blue-700); transform: scale(1.05); }

                /* --- Основной макет приложения (GermanVerbsApp) --- */
                .app-container { max-width: 896px; margin: 0 auto; min-height: 100vh; }
                .main-card {
                    background-color: var(--white);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    height: 100vh; /* Fallback for older browsers */
                    height: 100dvh; /* Dynamic viewport height */
                    box-sizing: border-box;
                }
                @media (min-width: 640px) {
                    .app-container { padding: 1rem; }
                    .main-card { 
                        border-radius: 0.75rem; 
                        padding: 1.5rem; 
                        height: calc(100vh - 2rem);
                        height: calc(100dvh - 2rem);
                    }
                }

                .main-card-header {
                    flex-shrink: 0;
                }

                .main-card-body {
                    flex-grow: 1;
                    // overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: var(--gray-200) transparent;
                }
                .main-card-body::-webkit-scrollbar { width: 6px; }
                .main-card-body::-webkit-scrollbar-track { background: transparent; }
                .main-card-body::-webkit-scrollbar-thumb { background-color: var(--gray-200); border-radius: 10px; }

                /* --- Хедер приложения (GermanVerbsApp) --- */
                .app-header {
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    flex-wrap: wrap; 
                    gap: 1rem; 
                    margin-bottom: 1.5rem; 
                    padding: 0 0.5rem;
                }
                .level-badge {
                    width: 44px; height: 44px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; color: var(--white); font-size: 1rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    flex-shrink: 0;
                }
                .level-badge.level-a1 { background-color: var(--orange-400); }
                .level-badge.level-a2 { background-color: var(--amber-400); }
                .level-badge.level-b1 { background-color: var(--lime-400); }
                .level-badge.level-b2 { background-color: var(--cyan-400); }

                .mode-toggle { flex-grow: 1; display: flex; justify-content: center; }
                .toggle-group { background-color: var(--gray-100); padding: 0.25rem; border-radius: 0.5rem; display: inline-flex; }
                .toggle-group button { padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; }
                .toggle-group button.active { color: var(--white); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .toggle-group button:nth-child(1).active { background-color: var(--blue-600); }
                .toggle-group button:nth-child(2).active { background-color: var(--green-600); }

                .header-icons { display: flex; align-items: center; gap: 0.25rem; }
                .header-icon-btn { padding: 0.5rem; color: var(--gray-500); }
                .header-icon-btn:hover { color: var(--gray-800); }

                @media (max-width: 480px) {
                    .app-header { justify-content: space-between; }
                    .mode-toggle { order: 3; width: 100%; margin-top: 0.5rem; }
                }

                /* --- Навигация по глаголам и действия (GermanVerbsApp) --- */
                .verb-navigation {
                    display: flex; 
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }
                .nav-btn { padding: 0.75rem; background-color: var(--gray-200); border-radius: 9999px; }
                .nav-btn:hover { background-color: #d1d5db; }
                .verb-display { flex: 1; margin: 0 1rem; }
                .verb-display h2 { font-size: 2.25rem; font-weight: 700; color: var(--gray-800); margin: 0; flex-shrink: 1; min-width: 0; }
                .verb-display p { margin: 0.25rem 0 0.5rem; color: var(--gray-500); }

                /* --- Переключатель вида изучения (GermanVerbsApp) --- */
                .study-view-toggle {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .study-view-toggle button {
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    color: var(--gray-500);
                    border: 2px solid transparent;
                }
                .study-view-toggle button.active {
                    color: var(--blue-600);
                    background-color: var(--blue-50);
                }
                .study-view-toggle button:not(.active):hover {
                    background-color: var(--gray-100);
                }

                /* --- Оригинальная таблица спряжения (GermanVerbsApp) --- */
                .table-container { background-color: white; border-radius: 0.5rem; overflow: hidden; }
                .table-container table { width: 100%; border-collapse: collapse; }
                /* 
                  Убрано чередование фоновых цветов строк: теперь фон всех строк одинаковый (белый).
                  Бордеры оставлены белыми, высота строк прежняя.
                */
                .table-container td { border: 1px solid #fff; padding: 0.5rem; }
                .speak-cell { text-align: center; width: 48px; }
                .speak-cell button { padding: 0.25rem; color: var(--gray-500); }
                .pronoun-cell { font-weight: 500; }
                .pronoun-russian { font-size: 0.875rem; color: var(--gray-500); margin-left: 0.5rem; }
                @media (max-width: 640px) { .pronoun-russian { display: none; } }
                .verb-form-cell { font-weight: 700; color: var(--blue-600); }
                .verb-form-cell div { display: flex; align-items: center; gap: 0.5rem; }

                /* --- Компонент VerbFormsDisplay (UI/UX Overhaul) --- */
                .verb-forms-container {
                    display: flex;
                    flex-direction: column;
                }
                .table-content-wrapper {
                    min-height: 160px; /* Prevents layout jump */
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                /*
                  Обновлено: убрано чередование фоновых цветов строк, увеличена высота строк.
                  Теперь фон всех строк одинаковый (белый), а высота строк больше для лучшей читаемости.
                */
                .verb-forms-grid-table-wrapper {
                    background-color: white;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    overflow-x: auto;
                    border: none;
                    /* Скрываем скроллбар во всех браузерах */
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* IE и Edge */
                }
                .verb-forms-grid-table-wrapper::-webkit-scrollbar {
                    display: none; /* Safari и Chrome */
                }

                .verb-forms-grid-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.85rem;
                }
                .verb-forms-grid-table td {
                    border: 1px solid #fff; /* белые бордеры */
                    padding: 0.85rem 0.75rem; /* увеличенная высота строки */
                    background-color: #fff; /* одинаковый фон для всех строк */
                    white-space: nowrap; /* Запрещаем перенос текста */
                }
                .verb-forms-grid-table th {
                    background-color: var(--gray-100);
                    font-weight: 600;
                    font-size: 0.8rem;
                    color: var(--gray-900);
                    text-align: center;
                    border: none;
                    padding: 0.85rem 0.75rem; /* увеличенная высота строки */
                    white-space: nowrap; /* Запрещаем перенос текста в заголовках */
                }
                .verb-forms-grid-table th:first-child,
                .verb-forms-grid-table td:first-child {
                    border-left: none;
                }
                .verb-forms-grid-table tr:last-child td {
                    border-bottom: none;
                }
                .verb-forms-grid-table th:last-child,
                .verb-forms-grid-table td:last-child {
                    border-right: none;
                }
                .verb-forms-grid-table b {
                    color: var(--blue-600);
                    font-weight: 700;
                }
                /* Стилизация для "липкой" первой колонки, аналогично основной таблице */
                .verb-forms-grid-table th.sticky-col,
                .verb-forms-grid-table td.sticky-col {
                    position: sticky;
                    left: 0;
                    z-index: 2;
                    background-color: var(--gray-100);
                }
                .verb-forms-grid-table td.sticky-col {
                    font-weight: 500;
                    color: var(--gray-600);
                    background-color: var(--white);
                    z-index: 1;
                }
                .pronoun-selector-wrapper {
                    position: relative;
                }
                .pronoun-selector-wrapper::before, .pronoun-selector-wrapper::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 20px;
                    pointer-events: none;
                    z-index: 2;
                }
                .pronoun-selector-wrapper::before {
                    left: 0;
                    background: linear-gradient(to right, var(--white), transparent);
                }
                .pronoun-selector-wrapper::after {
                    right: 0;
                    background: linear-gradient(to left, var(--white), transparent);
                }

                .pronoun-selector-container {
                    display: flex;
                    gap: 0.5rem;
                    overflow-x: auto;
                    padding: 0.5rem 1rem;
                    scrollbar-width: none; /* Firefox */
                    overscroll-behavior-x: contain;
                    touch-action: pan-x;
                }
                .pronoun-selector-container::-webkit-scrollbar {
                    display: none; /* Safari and Chrome */
                }
                .pronoun-selector-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 9999px;
                    font-weight: 500;
                    font-size: 0.875rem;
                    background-color: var(--gray-100);
                    color: var(--gray-800);
                    flex-shrink: 0;
                    border: 2px solid transparent;
                }
                .pronoun-selector-btn.active {
                    background-color: var(--blue-100);
                    color: var(--blue-700);
                    font-weight: 700;
                    border-color: var(--blue-600);
                }

                @media (max-width: 640px) {
                    .verb-forms-container {
                        margin: 0 -1rem; /* Edge-to-edge */
                    }
                    .verb-forms-grid-table-wrapper {
                        border-left: none;
                        border-right: none;
                        border-radius: 0;
                    }
                    .pronoun-selector-wrapper::before {
                        background: linear-gradient(to right, var(--white), transparent);
                    }
                    .pronoun-selector-wrapper::after {
                        background: linear-gradient(to left, var(--white), transparent);
                    }
                }

                /* --- Практика (Practice Box, внутри GermanVerbsApp) --- */
                .practice-box { background-color: var(--green-50); border-radius: 0.5rem; padding: 1.5rem; }
                .practice-prompt { text-align: center; margin-bottom: 1.5rem; }
                .practice-input-group { display: flex; justify-content: center; align-items: center; gap: 1rem; flex-wrap: wrap; }
                .practice-input-group span { font-size: 1.5rem; font-weight: 600; color: var(--gray-800); }
                .practice-input-group input {
                    font-size: 1.125rem; font-weight: 500; color: var(--gray-800); background-color: transparent;
                    border: none; border-bottom: 2px solid var(--gray-200); border-radius: 0;
                    width: 150px; padding: 0.5rem 0.25rem; text-align: center; transition: border-color 0.3s ease;
                }
                .practice-input-group input:focus { outline: none; border-bottom-color: var(--green-500); }
                .practice-input-group button {
                    width: 44px; height: 44px; background-color: var(--green-500); color: var(--white);
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                }
                .practice-input-group button:hover { background-color: var(--green-600); }
                .practice-input-group button:disabled { background-color: var(--gray-200); }
                .feedback-box { text-align: center; padding: 0.75rem; margin-top: 1.5rem; border-radius: 0.5rem; }
                .feedback-box.correct { background-color: var(--green-100); color: var(--green-800); }
                .feedback-box.incorrect { background-color: var(--red-100); color: var(--red-700); }
                .hint-container { text-align: center; margin-top: 1.5rem; min-height: 42px; display: flex; align-items: center; justify-content: center; }
                .hint-btn { color: var(--gray-400); padding: 0.5rem; border-radius: 50%; }
                .hint-btn:hover { color: var(--amber-400); background-color: #fffbeb; }
                .hint-box { padding: 0.75rem 1rem; background-color: var(--yellow-100); border-radius: 0.5rem; display: inline-block; font-weight: 500; }

                /* --- Плавающие кнопки действий (FAB, GermanVerbsApp) --- */
                .fab-container { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 40; display: flex; flex-direction: column; gap: 1rem; }
                .fab-button {
                    width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center;
                    justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: var(--white);
                }
                .fab-button.speak-fab { background-color: var(--blue-600); }
                .fab-button.gemini-fab { background-color: var(--purple-500); }
                .fab-button:hover { transform: scale(1.05); filter: brightness(1.1); opacity: 100}

                /* --- Модальные окна и тосты (GeminiInfoModal, SettingsModal, VerbListModal, LevelUpToast) --- */
                .modal-overlay {
                    position: fixed; inset: 0; background-color: var(--black-t60);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 50; padding: 0.5rem; animation: fadeIn 0.3s ease;
                }
                .modal-content {
                    background-color: var(--white); border-radius: 0.75rem; max-width: 512px; width: 100%;
                    position: relative; display: flex; flex-direction: column; max-height: 90vh;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    animation: scaleIn 0.3s ease;
                }
                .modal-close-btn {
                    position: absolute; top: 0.5rem; right: 1rem; padding: 1rem;
                    color: var(--gray-500); z-index: 10;
                }
                .modal-close-btn:hover { color: var(--gray-800);  border-radius: 50%;}
                .modal-title { margin-top: 0; font-size: 1.5rem; font-weight: 700; padding: 0; display: flex; align-items: center; gap: 0.5rem; text-transform: capitalize; margin-bottom: 0.1rem; }
                .verb-info-subtitle { font-size: 0.8rem; color: var(--gray-500); margin: 0 0 0 2rem; }
                .icon-purple { color: var(--purple-500); }
                .modal-body-container { overflow-y: auto; padding-bottom: 5rem; }

                /* Скрываем скроллбар для всех элементов, чтобы он не отображался визуально */
                ::-webkit-scrollbar {
                    width: 0px;
                    background: transparent; /* делаем фон прозрачным */
                }
                /* Для Firefox */
                * {
                    scrollbar-width: none; /* полностью скрываем скроллбар */
                    -ms-overflow-style: none; /* для IE и Edge */
                }

                .verbs-list-modal-footer {
                  hefight: 20px;
                  background-color: red
                }

                .loader-container {display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--gray-500); }
                .loader { width: 3rem; height: 3rem; color: var(--blue-600); animation: spin 1s linear infinite; }
                .loader-small { width: 1rem; height: 1rem; color: var(--white); animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .gemini-modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1rem 1rem 0.5rem 1.5rem; flex-shrink: 0; }
                .modal-footer {
                    padding: 1rem;
                    background-color: var(--white);
                    border-top: 1px solid var(--gray-200);
                    flex-shrink: 0;
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    box-sizing: border-box;
                    border-radius: 0 0 0.75rem 0.75rem;
                }
                .regenerate-btn-footer {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    background-color: var(--blue-600);
                    color: var(--white);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                .regenerate-btn-footer:hover { background-color: var(--blue-700); }
                .regenerate-btn-footer:disabled { background-color: var(--gray-400); }
                
                /* --- Вкладки настроек и инфо (SettingsModal) --- */
                .settings-tabs { display: flex; border-bottom: 1px solid var(--gray-200); padding: 1rem 1.5rem 0 1.5rem; }
                .settings-tabs button {
                    padding: 0.5rem 1rem; border-bottom: 2px solid transparent;
                    display: flex; align-items: center; gap: 0.5rem;
                    margin-bottom: -1px; color: var(--gray-500);
                }
                .settings-tabs button.active { border-bottom-color: var(--blue-600); color: var(--blue-600); }
                .info-tab { font-size: 0.95rem; line-height: 1.6; }
                .info-tab h4, .info-tab h5 { margin-top: 1.5rem; margin-bottom: 0.5rem; }
                .info-tab ul { padding-left: 1.5rem; }
                .info-tab li { margin-bottom: 0.5rem; }
                .info-tab table { width: 100%; margin-top: 1rem; border-collapse: collapse; }
                .info-tab td { padding: 0.5rem; border: 1px solid var(--gray-200); }
                .info-tab td:first-child { font-weight: 600; }

                /* --- Модальное окно списка глаголов (VerbListModal) --- */
                .verb-list-modal .modal-body-container { width: 95vw; padding: 0; background-color: white; max-height: 83dvh; border-radius: 0 0 20px 25px; }
                .verb-list-header { border-bottom: 1px solid var(--gray-200); background-color: white; border-radius: 20px 20px 0 0;}
                .verb-list-header .modal-title { text-transform: none; }
                .search-bar { position: relative; }
                .search-bar svg { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--gray-400); }
                .search-bar input {
                    width: 100%; box-sizing: border-box; 
                    border: 1px solid var(--gray-200); border-radius: 0.5rem; font-size: 1rem;
                }


                /* Сделаем placeholder в input светлее, чтобы он был менее заметен на фоне текста.
                   Используем ::placeholder для разных браузеров. */
                .search-bar input::placeholder {
                    color: rgb(211, 211, 211); /* светло-серый оттенок для placeholder */
                    opacity: 1; /* для совместимости */
                }




                .search-bar input:focus { outline: none; border-color: var(--blue-600); box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2); }
                .level-header {
                    margin: 0;
                    padding: 10px 15px;
                    font-size: 0.875rem; font-weight: 600; color: var(--gray-500);
                    font-weight: 700;
                    position: sticky; top: 0px;
                    background-color: var(--white);
                    background-color:rgb(246, 246, 246);
                }
                .verb-list { list-style: none; padding: 0; margin: 0; }
                .verb-list li { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1rem; border-radius: 0.375rem; cursor: pointer; }
                .verb-list li:hover { background-color: var(--blue-50); }
                .verb-translation { color: var(--gray-500); font-size: 0.875rem; margin-left: 0.5rem; }
                .check-mark { color: var(--green-500); }
                .no-results { text-align: center; padding: 2rem; color: var(--gray-500); }
                .error-box { background-color: var(--red-100); color: var(--red-700); padding: 1rem; border-radius: 0.5rem; text-align: center;}

                /* --- Сброс прогресса (SettingsModal) --- */
                .reset-section { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--gray-200); }
                .reset-section h4 { font-weight: 600; color: var(--red-700); }
                .reset-section p { font-size: 0.875rem; color: var(--gray-500); }
                .reset-btn-initial, .reset-btn-confirm { width: 100%; padding: 0.75rem; border-radius: 0.5rem; color: var(--white); font-weight: 600; margin-top: 0.5rem; }
                .reset-btn-initial { background-color: var(--red-500); }
                .reset-btn-initial:hover { background-color: var(--red-700); }
                .reset-confirm { border: 1px solid var(--red-100); background-color: #fff5f5; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; text-align: center; }
                .reset-confirm p { color: var(--red-700); font-weight: 600; margin: 0 0 1rem 0; }
                .reset-confirm button { padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 500; }
                .reset-btn-cancel { background-color: var(--gray-200); }
                .reset-btn-cancel:hover { background-color: #d1d5db; }
                .reset-btn-confirm { background-color: var(--red-500); color: var(--white); margin-left: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem; }
                .reset-btn-confirm:hover { background-color: var(--red-700); }

                /* --- Тост повышения уровня (LevelUpToast) --- */
                .level-up-toast {
                    position: fixed; top: 1.25rem; right: 1.25rem; background-color: var(--green-500); color: var(--white);
                    padding: 1rem; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    z-index: 100; display: flex; align-items: center; gap: 0.75rem;
                    animation: bounce-in 0.5s ease-out;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); } to { transform: scale(1); } }
                @keyframes bounce-in { 0% { opacity: 0; transform: scale(0.5) translateY(-50px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }

                /* --- Аккордеон в модальном окне (GeminiInfoModal) --- */
                .accordion-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem; }
                .accordion-item { background-color: var(--blue-50); border-radius: 0.5rem; overflow: hidden; border: 1px solid var(--gray-200); }
                .accordion-header { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; cursor: pointer; user-select: none; }
                .accordion-header:hover { background-color: var(--blue-100); }
                .accordion-title .example-german { font-weight: 500; color: var(--gray-800); margin: 0; font-size: 0.9rem; }
                .pronoun-tag { background-color: var(--blue-100); color: var(--blue-700); padding: 0.1rem 0.4rem; border-radius: 0.25rem; font-size: 0.8rem; margin-right: 0.5rem; }
                .accordion-title .example-russian { font-size: 0.8rem; font-style: italic; color: var(--gray-500); margin: 0.1rem 0 0; }
                .accordion-controls { display: flex; align-items: center; gap: 0.25rem; }
                .speak-btn-small { padding: 0.25rem; color: var(--gray-500); border-radius: 50%; }
                .speak-btn-small:hover { background-color: rgba(0,0,0,0.05); }
                .accordion-icon { transition: transform 0.3s ease-in-out; color: var(--gray-500); }
                .accordion-icon.active { transform: rotate(180deg); }
                .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.4s ease-in-out, padding 0.4s ease-in-out; padding: 0 0.2rem; }
                .accordion-content.active { max-height: 500px; padding: 0.2rem; }
                .example-german b { color: var(--blue-600); font-weight: 700; }

                /* --- Компактная таблица спряжения (ConjugationTable) --- */
                .conjugation-table-wrapper { 
                    background-color: var(--white); 
                    border-radius: 0.375rem; 
                    margin-top: 0.25rem; 
                    /* border убран по просьбе пользователя */
                    overflow-x: auto; 
                }
                .conjugation-table-wrapper::-webkit-scrollbar { height: 4px; }
                .conjugation-table-wrapper::-webkit-scrollbar-track { background: var(--gray-100); }
                .conjugation-table-wrapper::-webkit-scrollbar-thumb { background: var(--blue-100); border-radius: 4px; }
                .conjugation-table-wrapper::-webkit-scrollbar-thumb:hover { background: var(--blue-600); }

                .conjugation-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; white-space: nowrap; }
                /* Убираем границы ячеек таблицы */
                .conjugation-table th, .conjugation-table td { 
                    border: none; /* border убран */
                    padding: 0.4rem 0.6rem; 
                    text-align: left; 
                    vertical-align: middle; 
                }
                /* Цвет заголовков колонок: делаем явным */
                .conjugation-table th { 
                    background-color: var(--gray-50); 
                    font-weight: 600; 
                    text-align: center; 
                    color: var(--gray-900); /* Явно задаём цвет текста заголовков */
                }
                /* Закрепляем первую колонку (и th, и td) */
                .conjugation-table th:first-child,
                .conjugation-table td:first-child {
                    position: sticky;
                    left: 0;
                    z-index: 2; /* th будет поверх td */
                    background-color: var(--gray-50);
                }
                .conjugation-table td:first-child {
                    font-weight: 500;
                    color: var(--gray-600);
                    background-color: var(--white); /* перекрываем фон для td */
                    z-index: 1;
                }
                .conjugation-table td b { color: var(--blue-600); font-weight: 700; }
                .table-cell-content { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
                .speak-btn-tiny { color: var(--gray-400); padding: 0.1rem; border-radius: 50%; flex-shrink: 0; }
                .speak-btn-tiny:hover { color: var(--gray-800); background-color: var(--gray-100); }
            `}</style>
    </>
  );
}

export default GermanVerbsApp;
