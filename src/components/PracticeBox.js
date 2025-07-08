import React, { useState, useRef, useEffect } from "react";
import { Lightbulb, Check, Volume2 } from "lucide-react";
import PracticeCompletionModal from "./PracticeCompletionModal";
import PracticeExamplesModal from "./PracticeExamplesModal";
import { fetchContextExamples } from "../api/gemini";

/**
 * PracticeBox — современный минималистичный режим практики.
 * Только выбор из вариантов (кнопки), без поля ввода.
 * Мини-статистика сверху, лаконичный дизайн, плавные анимации.
 */
function PracticeBox({
  verb,
  onNextVerb,
  onBackToStudy,
  onComplete,
  streak,
  setStreak,
  errors,
  setErrors,
  total,
  setTotal,
  ...rest
}) {
  // --- Константы ---
  const pronouns = [
    { german: "ich", russian: "я" },
    { german: "du", russian: "ты" },
    { german: "er/sie/es", russian: "он/она/оно" },
    { german: "wir", russian: "мы" },
    { german: "ihr", russian: "вы (мн.)" },
    { german: "sie/Sie", russian: "они/Вы" },
  ];

  // --- Состояния ---
  const [currentPronoun, setCurrentPronoun] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [explanationText, setExplanationText] = useState("");
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [showExamplesModal, setShowExamplesModal] = useState(false); // модалка примеров
  const [pendingContinue, setPendingContinue] = useState(false);
  const [mistakeIndices, setMistakeIndices] = useState([]);
  const mistakeIndicesRef = useRef(mistakeIndices);
  useEffect(() => {
    mistakeIndicesRef.current = mistakeIndices;
  }, [mistakeIndices]);
  const [mistakeStats, setMistakeStats] = useState([]); // массив объектов: { round, total, errors }
  const [isMistakeRound, setIsMistakeRound] = useState(false);
  const [mistakeRoundNumber, setMistakeRoundNumber] = useState(0);
  const [showMistakeModal, setShowMistakeModal] = useState(false); // модалка перехода к ошибкам
  const [examplesPhase, setExamplesPhase] = useState(null); // null | 'correct' | 'examples'
  const [answerOptions, setAnswerOptions] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // --- Генерация вариантов ответов (для кнопок) ---
  useEffect(() => {
    if (!verb || !verb.forms) return;
    const correct = verb.forms[currentPronoun];
    // Собираем только уникальные формы
    const uniqueForms = Array.from(new Set(verb.forms));
    // Убираем правильный ответ из массива, чтобы не было двух одинаковых
    const distractors = uniqueForms.filter((f) => f !== correct);
    // Перемешиваем и берём максимум 3 неверных варианта
    const shuffledDistractors = shuffleArray(distractors).slice(0, 3);
    // Собираем итоговый массив и снова перемешиваем
    const options = shuffleArray([correct, ...shuffledDistractors]);
    setAnswerOptions(options);
  }, [verb, currentPronoun]);

  // --- Проверка ответа ---
  function checkAnswer(answer) {
    if (finished) return;
    setSelectedAnswer(answer);
    const correct = verb.forms[currentPronoun];
    setTotal((t) => t + 1);
    if (answer === correct) {
      setFeedback("Верно!");
      setStreak((s) => s + 1);
      if (isMistakeRound) {
        setMistakeIndices((prev) => {
          const updated = prev.filter((idx) => idx !== currentPronoun);
          setTimeout(() => {
            setFeedback("");
            setShowHint(false);
            setHintUsed(false);
            setSelectedAnswer(null);
            if (updated.length === 0) {
              if (typeof onComplete === "function") onComplete();
            } else {
              setCurrentPronoun(updated[0]);
            }
          }, 900);
          return updated;
        });
        return;
      }
      setTimeout(() => {
        setFeedback("");
        setShowHint(false);
        setHintUsed(false);
        setSelectedAnswer(null);
        const indices = getCurrentIndices();
        const idx = indices.indexOf(currentPronoun);
        if (idx + 1 < indices.length) {
          setCurrentPronoun(indices[idx + 1]);
        } else {
          // После последнего вопроса обычного раунда — всегда использовать актуальный mistakeIndices
          handleRoundFinish(mistakeIndicesRef.current);
        }
      }, 900);
    } else {
      setErrors((e) => e + 1);
      setStreak(0);
      setShowExamplesModal(true);
      setExplanationText("LOADING");
      setMistakeIndices((prev) => {
        if (!prev.includes(currentPronoun)) {
          return [...prev, currentPronoun];
        }
        return prev;
      });
      fetchContextExamples({
        verb,
        pronoun: pronouns[currentPronoun].german,
        correctForm: correct,
        wrongForm: answer,
        setter: setExplanationText,
      });
    }
  }

  function getCurrentIndices() {
    // Если идёт работа над ошибками — только ошибочные индексы, иначе все
    return isMistakeRound ? mistakeIndices : pronouns.map((_, i) => i);
  }

  function handleRoundFinish(currentMistakes = mistakeIndicesRef.current) {
    // Сохраняем статистику по раунду
    setMistakeStats((prev) => [
      ...prev,
      {
        round: isMistakeRound ? mistakeRoundNumber : 0,
        total,
        errors,
      },
    ]);
    if (!isMistakeRound && currentMistakes.length > 0) {
      // Запускаем работу над ошибками
      setIsMistakeRound(true);
      setMistakeRoundNumber((n) => n + 1);
      setShowMistakeModal(true); // показываем модалку только при первом переходе
      // setCurrentPronoun(mistakeIndices[0]); // переносим в onMistakeModalOk
      return;
    }
    if (isMistakeRound && currentMistakes.length > 0) {
      // Повторный раунд ошибок — сразу начинаем
      setMistakeRoundNumber((n) => n + 1);
      setCurrentPronoun(currentMistakes[0]);
      return;
    }
    // Всё правильно — завершение
    if (typeof onComplete === "function") onComplete();
    setIsMistakeRound(false);
    setMistakeIndices([]);
  }

  function handleExamplesContinue() {
    setShowExamplesModal(false);
    setFeedback("");
    setShowHint(false);
    setHintUsed(false);
    setExplanationText("");
    setSelectedAnswer(null);
    const indices = getCurrentIndices();
    const idx = indices.indexOf(currentPronoun);
    if (idx + 1 < indices.length) {
      setCurrentPronoun(indices[idx + 1]);
    } else {
      handleRoundFinish();
    }
  }

  // --- Подсказка ---
  function handleHint() {
    setShowHint(true);
    setHintUsed(true);
  }

  // --- Озвучка ---
  function speak(text, lang = "de-DE") {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function shuffleArray(arr) {
    return arr.slice().sort(() => Math.random() - 0.5);
  }

  // Обработчики для модального окна завершения
  function handleRestart() {
    setCurrentPronoun(0);
    setFeedback("");
    setShowHint(false);
    setHintUsed(false);
    setStreak(0);
    setErrors(0);
    setTotal(0);
    setShowExplanation(false);
    setExplanationText("");
    setFinished(false);
    setShowCompletionModal(false);
    setSelectedAnswer(null);
    setMistakeIndices([]);
    setMistakeStats([]);
    setIsMistakeRound(false);
    setMistakeRoundNumber(0);
  }

  function handleNextVerb() {
    if (onNextVerb) {
      onNextVerb();
    }
    setShowCompletionModal(false);
  }

  function handleBackToStudy() {
    if (onBackToStudy) {
      onBackToStudy();
    }
    setShowCompletionModal(false);
  }

  // Обработчик для модалки ошибок
  function handleMistakeModalOk() {
    setShowMistakeModal(false);
    setCurrentPronoun(mistakeIndices[0]);
  }

  // --- Вспомогательная функция для форматирования примеров ---
  function renderExamples(explanationText) {
    if (explanationText === "LOADING") {
      return (
        <div className="examples-loader">
          <span className="loader-circle" />
          <span style={{ marginLeft: 8 }}>Генерируем примеры...</span>
        </div>
      );
    }
    // Показываем только строки с <b> (примеры)
    return explanationText
      .split(/\n|\r|\d+\./)
      .filter((line) => /<b>.*<\/b>/.test(line))
      .map((line, idx) => {
        // Подсвечиваем глагол цветом
        const colored = line.replace(
          /<b>(.*?)<\/b>/g,
          '<b class="verb-highlight">$1</b>'
        );
        // Пример: Du <b class="verb-highlight">bist</b> groß. (Ты большой.)
        const match = colored.match(/^(.*?)(\([^\)]*\))?$/);
        if (!match) return <div key={idx}>{line}</div>;
        const [_, german, ru] = match;
        return (
          <div key={idx} className="example-row">
            <span
              dangerouslySetInnerHTML={{ __html: german.trim() }}
              style={{ fontWeight: 600 }}
            />
            {ru && <span className="example-ru"> {ru}</span>}
          </div>
        );
      });
  }

  if (!verb || !verb.forms) {
    return <div className="error-box">Нет данных для практики.</div>;
  }

  const correctAnswer = verb.forms[currentPronoun];

  return (
    <>
      {/* Модалка перехода к ошибкам */}
      {showMistakeModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ textAlign: "center", padding: "2rem 1.5rem" }}
          >
            <h2 style={{ marginBottom: "1.5rem", color: "#16a34a" }}>
              Исправим ошибки!
            </h2>
            <button
              style={{
                background: "#22c55e",
                color: "white",
                fontWeight: 600,
                fontSize: "1.1rem",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.75rem 2.5rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(34,197,94,0.15)",
              }}
              onClick={handleMistakeModalOk}
            >
              Ок
            </button>
          </div>
        </div>
      )}
      <div className="practice-box-modern">
        <div className="practice-stats-modern">
          <span>
            Серия: <b>{streak}</b>
          </span>
          <span>
            Ошибок: <b>{errors}</b>
          </span>
          <span>
            Всего: <b>{total}</b>
          </span>
        </div>
        <div className="practice-card-modern">
          <div className="practice-prompt-modern">
            <span className="prompt-pronoun">
              {pronouns[currentPronoun].german}
            </span>
          </div>
          <div className="answer-options-modern">
            {answerOptions.map((opt, idx) => {
              let className = "option-btn-modern";
              if (selectedAnswer) {
                if (opt === correctAnswer) {
                  className += " correct";
                } else if (
                  opt === selectedAnswer &&
                  selectedAnswer !== correctAnswer
                ) {
                  className += " incorrect";
                }
              }
              return (
                <button
                  key={idx}
                  className={className}
                  onClick={() => checkAnswer(opt)}
                  disabled={!!selectedAnswer || finished}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {feedback && (
            <div className="feedback-modern correct">{feedback}</div>
          )}
          {showExplanation && explanationText && false && (
            <div className="explanation-modern">
              <div className="examples-header">
                Ой, ошибка... Но это ничего!
                <br />
                <span style={{ fontSize: "0.92em", fontWeight: 400 }}>
                  Посмотрим примеры для закрепления
                </span>
              </div>
              {renderExamples(explanationText)}
            </div>
          )}
          {showContinueButton && (
            <div className="continue-container">
              <button className="continue-btn" onClick={handleExamplesContinue}>
                Продолжить
              </button>
            </div>
          )}
          <div className="hint-container-modern">
            {showHint ? (
              <div className="hint-box-modern">
                {pronouns[currentPronoun].german} {verb.forms[currentPronoun]}
              </div>
            ) : (
              <>
                <button
                  className="hint-btn-modern"
                  onClick={handleHint}
                  title="Показать подсказку"
                  disabled={hintUsed || finished}
                >
                  <Lightbulb size={20} />
                </button>

                <button
                  className="speak-btn-modern"
                  onClick={() =>
                    speak(
                      `${pronouns[currentPronoun].german} ${verb.forms[currentPronoun]}`
                    )
                  }
                  disabled={isSpeaking}
                  title="Озвучить форму"
                >
                  <Volume2 size={25} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <PracticeCompletionModal
        show={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        stats={{ streak, errors, total }}
        onRestart={handleRestart}
        onNextVerb={handleNextVerb}
        onBackToStudy={handleBackToStudy}
      />

      <PracticeExamplesModal
        show={showExamplesModal}
        examples={renderExamples(explanationText)}
        onContinue={handleExamplesContinue}
      />

      <style>{`
        .practice-box-modern {
          max-width: 420px;
          margin: 2.5rem auto 0 auto;
          padding: 0;
        }
        .practice-stats-modern {
          display: flex;
          gap: 1.5rem;
          font-size: 1rem;
          color: #64748b;
          justify-content: center;
          margin-bottom: 1.2rem;
        }
        .practice-stats-modern b { color: #2563eb; }
        .practice-card-modern {
          background: #fff;
          border-radius: 1.1rem;
          box-shadow: 0 4px 24px rgba(37,99,235,0.07), 0 1.5px 8px rgba(0,0,0,0.04);
          padding: 2.2rem 1.5rem 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          min-height: 260px;
        }
        .practice-prompt-modern {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.1rem;
          margin-bottom: 2.1rem;
        }
        .prompt-pronoun {
          font-size: 2rem;
          font-weight: 500;
          color: #475569;
        }
        .speak-btn-modern {
          color: #bfc9d7;
          background: none;
          border: none;
          padding: 0.2rem;
          border-radius: 50%;
          transition: background 0.15s;
        }
        .speak-btn-modern:hover { color:rgb(122, 145, 193); }
        .answer-options-modern {
          display: flex;
          gap: 0.7rem;
          justify-content: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          align-items: stretch;
        }
        .option-btn-modern {
          flex: 1 1 120px;
          min-width: 120px;
          max-width: 180px;
          padding: 1.1rem 0.5rem;
          border-radius: 0.9rem;
          background: #f3f4f6;
          color: #1e293b;
          font-size: 1.18rem;
          font-weight: 500;
          border: 2px solid transparent;
          transition: background 0.18s, border 0.18s, color 0.18s, transform 0.15s;
          margin: 0.2rem 0.1rem;
          box-sizing: border-box;
          text-align: center;
          cursor: pointer;
        }
        .option-btn-modern:hover, .option-btn-modern:focus {
          background: #dbeafe;
          border-color: #2563eb;
          transform: scale(1.04);
        }
        .option-btn-modern.correct {
          background: #dcfce7;
          border-color: #22c55e;
          color: #166534;
        }
        .option-btn-modern.incorrect {
          background: #fee2e2;
          border-color: #ef4444;
          color: #b91c1c;
        }
        .feedback-modern {
          text-align: center;
          padding: 0.7rem;
          margin-bottom: 0.7rem;
          border-radius: 0.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          transition: background 0.18s, color 0.18s;
        }
        .feedback-modern.correct {
          background-color: #dcfce7;
          color: #166534;
        }
        .hint-container-modern {
          text-align: center;
          margin-top: 1.1rem;
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        .hint-btn-modern {
          color: #9ca3af;
          padding: 0.5rem;
          border-radius: 50%;
          background: none;
          border: none;
          transition: background 0.15s;
        }
        .hint-btn-modern:hover { color: #facc15;  }
        .hint-box-modern {
          padding: 0.7rem 1rem;
          background-color: #fef9c3;
          border-radius: 0.5rem;
          display: inline-block;
          font-weight: 500;
        }
        .explanation-modern {
          background: #f3f4f6;
          color:rgb(120, 128, 138);
          border-radius: 0.5rem;
          padding: 0.7rem 1rem;
          margin: 1rem auto 0 auto;
          max-width: 350px;
          font-size: 0.70rem;
          text-align: center;
        }
        .continue-container {
          text-align: center;
          margin-top: 1rem;
        }
        .continue-btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .continue-btn:hover {
          background: #1d4ed8;
        }
        .examples-header {
          color: #2563eb;
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 0.7rem;
          text-align: center;
        }
        .example-row {
          margin-bottom: 0.3rem;
          font-size: 0.9rem;
          line-height: 1.5;
          text-align: left;
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
        }
        .example-ru {
          color: #64748b;
          font-size: 0.97em;
          margin-left: 0.3em;
          font-weight: 400;
        }
        .examples-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #2563eb;
          font-size: 1.05rem;
          margin: 1.2rem 0;
        }
        .loader-circle {
          width: 1.2em;
          height: 1.2em;
          border: 3px solid #dbeafe;
          border-top: 3px solid #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 480px) {
          .practice-box-modern { max-width: 99vw; }
          .practice-card-modern { padding: 1.2rem 0.5rem 1.2rem 0.5rem; }
        }
        .verb-highlight {
          color: #2563eb;
          font-weight: 700;
          background: rgba(37,99,235,0.07);
          border-radius: 0.2em;
          padding: 0 0.15em;
        }
        .correct-answer-box {
          text-align: center;
          font-size: 1.15rem;
          color: #2563eb;
          margin: 1.2rem 0;
        }
      `}</style>
    </>
  );
}

export default PracticeBox;
