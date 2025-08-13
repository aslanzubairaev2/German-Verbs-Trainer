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
  Home,
  Mic,
} from "lucide-react";
import { allVerbs } from "./verbsData.js"; // <-- YOUR VERBS FILE IS CONNECTED HERE
import VerbListModal from "./components/VerbListModal.js";
import { loadUserVerbs } from "./storage/userVerbs";
import SettingsModal from "./components/SettingsModal.js";
import GeminiInfoModal from "./components/GeminiInfoModal.js";
import GeminiChatModal from "./components/GeminiChatModal.js";
import LevelUpToast from "./components/LevelUpToast.js";
import VerbFormsDisplay from "./components/VerbFormsDisplay.js";
import {
  pronouns,
  LEVEL_ORDER,
  LEVEL_UP_REQUIREMENTS,
  getVerbTypeLabel,
} from "./constants";
import { fetchGeminiInfo, fetchVerbForms } from "./api/gemini";
import StartScreen from "./components/StartScreen";
import PracticeBox from "./components/PracticeBox";
import PracticeCompletionModal from "./components/PracticeCompletionModal";
import useSpeechSynthesis from "./hooks/useSpeechSynthesis";
import PhraseTrainer from "./components/PhraseTrainer";
import InteractivePhrase from "./components/InteractivePhrase";
import AppHeader from "./components/AppHeader";
import VerbNavigation from "./components/VerbNavigation";
import StudyView from "./components/StudyView";
import FloatingActionButtons from "./components/FloatingActionButtons";
import { useAppProgress } from "./hooks/useAppProgress";
import styles from './App.module.css';

// --- MAIN APP COMPONENT ---
function GermanVerbsApp() {
  // --- STATE ---
  const { appState, setAppState, setLastVerbIndex } = useAppProgress();
  const [practiceMode, setPracticeMode] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [currentPronoun, setCurrentPronoun] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [audioReady, setAudioReady] = useState(false);
  const { speak, isSpeaking } = useSpeechSynthesis({ enabled: audioReady });
  const [showSettings, setShowSettings] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showVerbList, setShowVerbList] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState("");
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [showVerbChat, setShowVerbChat] = useState(false);
  const [geminiDataCache, setGeminiDataCache] = useState({});
  const [verbFormsCache, setVerbFormsCache] = useState({}); // <-- Cache for new forms
  const [studyView, setStudyView] = useState("conjugation"); // 'conjugation' or 'forms'
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [streak, setStreak] = useState(0);
  const [errors, setErrors] = useState(0);
  const [total, setTotal] = useState(0);
  const [showPhraseTrainer, setShowPhraseTrainer] = useState(false);
  const [curriculumMode, setCurriculumMode] = useState(false);
  const [verbsRevision, setVerbsRevision] = useState(0);

  // Voice select verb
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  function stopVoice() {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setListening(false);
  }
  async function handleVoicePickVerb() {
    if (listening) {
      stopVoice();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported.");
      return;
    }
    setListening(true);
    const tryLang = (lang) =>
      new Promise((resolve) => {
        const rec = new SR();
        recognitionRef.current = rec;
        rec.lang = lang;
        rec.interimResults = false;
        rec.maxAlternatives = 3;
        let resolved = false;
        rec.onresult = (e) => {
          const t = Array.from(e.results)
            .map((r) => r[0]?.transcript || "")
            .join(" ")
            .trim();
          if (!resolved) {
            resolved = true;
            resolve(t);
          }
        };
        rec.onerror = () => resolve("");
        rec.onend = () => !resolved && resolve("");
        rec.start();
      });
    let said = await tryLang("ru-RU");
    if (!said) said = await tryLang("de-DE");
    stopVoice();
    if (!said) return;
    // Find the best verb by infinitive/russian (simple search by includes + exact match has priority)
    const q = said.toLowerCase();
    let idx = allVerbs.findIndex(
      (v) => v.infinitive.toLowerCase() === q || v.russian.toLowerCase() === q
    );
    if (idx < 0)
      idx = allVerbs.findIndex(
        (v) =>
          v.infinitive.toLowerCase().includes(q) ||
          v.russian.toLowerCase().includes(q)
      );
    if (idx >= 0) {
      setLastVerbIndex(idx);
    }
  }

  // Curriculum mode trigger (scaffold)
  // curriculumMode state is already declared above; redundant block removed

  // Function to navigate to a specific verb from PhraseTrainer
  const navigateToVerb = useCallback((infinitive) => {
    // Find the verb index by infinitive
    const verbIndex = allVerbs.findIndex(
      (verb) => verb.infinitive === infinitive
    );
    if (verbIndex >= 0) {
      // Update the state with the new verb index
      setLastVerbIndex(verbIndex);
      // Switch back to verb study mode
      setShowPhraseTrainer(false);
      setAudioReady(true);
    }
  }, []);

  // --- DERIVED STATE & MEMOS ---
  const combinedVerbs = useMemo(() => {
    try {
      const user = loadUserVerbs();
      const map = new Map();
      for (const v of allVerbs) map.set(v.infinitive, v);
      for (const v of user) map.set(v.infinitive, v);
      return Array.from(map.values());
    } catch {
      return allVerbs;
    }
  }, [verbsRevision, appState.lastVerbIndex]);

  const availableVerbsForProgression = useMemo(
    () =>
      combinedVerbs.filter((verb) =>
        appState.unlockedLevels.includes(verb.level)
      ),
    [combinedVerbs, appState.unlockedLevels]
  );
  const currentVerb = combinedVerbs[appState.lastVerbIndex] || combinedVerbs[0];
  const currentLevel =
    appState.unlockedLevels[appState.unlockedLevels.length - 1];

  // --- EFFECTS ---
  useEffect(() => {
    // Reset view on mode change
    setStudyView("conjugation");
  }, [practiceMode]);

  // --- API & AUDIO ---
  // speak is taken from useSpeechSynthesis hook

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
          `Congratulations! You have unlocked level ${LEVEL_ORDER[nextLevelIndex]}!`
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
      setFeedback("Correct! ✓");
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
      setFeedback(`Incorrect. The correct answer is: ${correctAnswer}`);
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
    // Search for the index in the combined list to support custom verbs
    const verbIndex = combinedVerbs.findIndex(
      (v) => v.infinitive === verb.infinitive
    );
    if (verbIndex >= 0) {
      setLastVerbIndex(verbIndex);
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

    setLastVerbIndex(newMasterIndex);
    resetVerbState();
    if (autoPlay) {
      setTimeout(() => speak(allVerbs[newMasterIndex].infinitive), 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && userAnswer.trim()) checkAnswer();
  };

  // Wrapper to pass to VerbFormsDisplay
  const handleFetchVerbForms = (verb, pronoun, setter) => {
    fetchVerbForms({
      verb,
      pronoun,
      verbFormsCache,
      setVerbFormsCache,
      setter,
    });
  };

  // Wrapper to pass to GeminiInfoModal
  const handleFetchGeminiInfo = (verb, setter, force) => {
    fetchGeminiInfo({
      verb,
      geminiDataCache,
      setGeminiDataCache,
      setter,
      force,
    });
  };

  // Reset statistics only in onNextVerb, onRestart, onBackToStudy
  const handleRestart = () => {
    setShowCompletionModal(false);
    setStreak(0);
    setErrors(0);
    setTotal(0);
    setPracticeMode(true);
    setCurrentPronoun(0);
    setUserAnswer("");
    setFeedback("");
    setHintUsed(false);
    setShowHint(false);
    resetVerbState();
  };

  const handleNextVerb = () => {
    setShowCompletionModal(false);
    // Move to the next verb
    const currentIndexInAvailable = availableVerbsForProgression.findIndex(
      (v) => v.infinitive === currentVerb.infinitive
    );
    const nextIndexInAvailable =
      (currentIndexInAvailable + 1) % availableVerbsForProgression.length;
    const nextVerbInfinitive =
      availableVerbsForProgression[nextIndexInAvailable]?.infinitive;
    if (nextVerbInfinitive) {
      setLastVerbIndex(allVerbs.findIndex(
        (v) => v.infinitive === nextVerbInfinitive
      ));
    }
    setStreak(0);
    setErrors(0);
    setTotal(0);
    setPracticeMode(true);
    setCurrentPronoun(0);
    setUserAnswer("");
    setFeedback("");
    setHintUsed(false);
    setShowHint(false);
    resetVerbState();
  };

  const handleBackToStudy = () => {
    setShowCompletionModal(false);
    setPracticeMode(false);
    setStreak(0);
    setErrors(0);
    setTotal(0);
    setCurrentPronoun(0);
    setUserAnswer("");
    setFeedback("");
    setHintUsed(false);
    setShowHint(false);
    resetVerbState();
  };

  // --- RENDER ---
  if (!audioReady) {
    // Show start screen or PhraseTrainer
    if (showPhraseTrainer) {
      return (
        <PhraseTrainer
          onBackToMain={() => setShowPhraseTrainer(false)}
          curriculumMode={curriculumMode}
          onNavigateToVerb={navigateToVerb}
        />
      );
    }
    return (
      <StartScreen
        onStart={() => setAudioReady(true)}
        onStartCurriculum={() => {
          setCurriculumMode(true);
          setShowPhraseTrainer(true);
        }}
      />
    );
  }

  const currentIndexInAvailable = availableVerbsForProgression.findIndex(
    (v) => v.infinitive === currentVerb.infinitive
  );
  const nextIndexInAvailable =
    (currentIndexInAvailable + 1) % availableVerbsForProgression.length;
  const nextVerbInfinitive =
    availableVerbsForProgression[nextIndexInAvailable]?.infinitive;

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
        onOpenChat={() => setShowVerbChat(true)}
      />
      <GeminiChatModal
        show={showVerbChat}
        onClose={() => setShowVerbChat(false)}
        initialMessage={`I am studying the verb "${currentVerb.infinitive}" (${currentVerb.russian}). Give me a short explanation and 3-5 simple examples for A1-A2 level. Then I will ask questions.`}
      />
      <VerbListModal
        show={showVerbList}
        onClose={() => setShowVerbList(false)}
        onSelectVerb={selectVerb}
        verbs={combinedVerbs}
        masteredVerbs={appState.masteredVerbs}
        onAddedVerb={() => setVerbsRevision((v) => v + 1)}
      />
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        autoPlay={autoPlay}
        setAutoPlay={setAutoPlay}
        onResetProgress={resetAllProgress}
      />

      <div className={styles.appContainer}>
        <div className={styles.mainCard}>
          <div className={styles.mainCardHeader}>
            <AppHeader
              currentLevel={currentLevel}
              practiceMode={practiceMode}
              onToggleMode={setPracticeMode}
              onShowVerbList={() => setShowVerbList(true)}
              onShowSettings={() => setShowSettings(true)}
              onGoHome={() => setAudioReady(false)}
            />

            <VerbNavigation
              currentVerb={currentVerb}
              onPreviousVerb={() => changeVerb(-1)}
              onNextVerb={() => changeVerb(1)}
            />
          </div>

          <div className={styles.mainCardBody}>
            {practiceMode ? (
              showCompletionModal ? (
                <PracticeCompletionModal
                  show={showCompletionModal}
                  onClose={() => setShowCompletionModal(false)}
                  stats={{ streak, errors, total }}
                  onRestart={handleRestart}
                  onNextVerb={handleNextVerb}
                  onBackToStudy={handleBackToStudy}
                  nextVerb={nextVerbInfinitive}
                />
              ) : (
                <PracticeBox
                  verb={currentVerb}
                  onAnswer={checkAnswer}
                  userAnswer={userAnswer}
                  setUserAnswer={setUserAnswer}
                  feedback={feedback}
                  currentPronoun={currentPronoun}
                  pronouns={pronouns}
                  speak={speak}
                  isSpeaking={isSpeaking}
                  onHint={handleHint}
                  showHint={showHint}
                  hintUsed={hintUsed}
                  onComplete={() => setShowCompletionModal(true)}
                  streak={streak}
                  setStreak={setStreak}
                  errors={errors}
                  setErrors={setErrors}
                  total={total}
                  setTotal={setTotal}
                />
              )
            ) : (
              <StudyView
                studyView={studyView}
                onStudyViewChange={setStudyView}
                pronouns={pronouns}
                currentVerb={currentVerb}
                speak={speak}
                speakFullPhrase={speakFullPhrase}
                isSpeaking={isSpeaking}
                handleFetchVerbForms={handleFetchVerbForms}
              />
            )}
          </div>
        </div>
      </div>

      <FloatingActionButtons
        onShowGeminiInfo={() => setShowGeminiModal(true)}
        onShowVerbChat={() => setShowVerbChat(true)}
        onVoicePickVerb={handleVoicePickVerb}
        isListening={listening}
      />
    </>
  );
}

export default GermanVerbsApp;
