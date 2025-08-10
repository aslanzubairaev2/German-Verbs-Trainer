import React, { useState, useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { fetchLocalPhrase } from "../api/phrases";
import { generateSimilarPhrase } from "../api/gemini";
import { generateCurriculumPhrase } from "../api/gemini";
import { getNextTask, submitResult } from "../curriculum/engine";
import GeminiChatModal from "./GeminiChatModal";
import InteractivePhrase from "./InteractivePhrase";
import CardPhrase from "./CardPhrase";
import {
  Sparkles,
  Volume2,
  RotateCcw,
  ChevronLeft,
  HelpCircle,
} from "lucide-react";

/**
 * Компонент для тренировки немецких фраз из локального файла
 */
function PhraseTrainer({ onBackToMain, curriculumMode = false }) {
  const [loading, setLoading] = useState(false);
  const [phrase, setPhrase] = useState(null);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState("all");
  const [generatingSimilar, setGeneratingSimilar] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState("");
  const [currentPhraseId, setCurrentPhraseId] = useState(null);
  const [quotedPhrases, setQuotedPhrases] = useState([]);
  const cardRef = useRef(null);

  // Состояния для модалки перевода русского слова
  const [ruWordInfoCache, setRuWordInfoCache] = useState({});
  const [selectedRuWord, setSelectedRuWord] = useState(null);
  const [showRuWordInfo, setShowRuWordInfo] = useState(false);
  const [ruWordInfo, setRuWordInfo] = useState(null);

  // Состояние для режима обучения
  const [curriculumTask, setCurriculumTask] = useState(null);

  // Функция озвучивания
  const speak = useCallback((text, lang = "de-DE") => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  // Получение фразы
  const fetchPhrase = async () => {
    setLoading(true);
    setPhrase(null);
    setError(null);
    setIsFlipped(false);

    setCurrentPhraseId(null);
    setShowChatModal(false);

    try {
      if (curriculumMode) {
        const task = getNextTask();
        setCurriculumTask(task);
        const data = await generateCurriculumPhrase({
          level: task.level,
          topic: task.topic,
        });
        setPhrase(data);
        setError(null);
        setCurrentPhraseId(`${data.german}-${data.russian}`);
      } else {
        const filterType = selectedType === "all" ? null : selectedType;
        await fetchLocalPhrase({
          setter: ({ loading, data, error }) => {
            setLoading(!!loading);
            setPhrase(data);
            setError(error);
            if (data) setCurrentPhraseId(`${data.german}-${data.russian}`);
          },
          filterType,
        });
        return;
      }
    } catch (e) {
      setError("Не удалось получить фразу");
    } finally {
      setLoading(false);
    }
  };

  // Автоматическая загрузка фразы при монтировании компонента
  useEffect(() => {
    fetchPhrase();
  }, []); // Пустой массив зависимостей - выполняется только при монтировании

  // После переворота карточки считаем, что пользователь увидел правильный ответ — для демо зафиксируем результат как верный
  useEffect(() => {
    if (!curriculumMode) return;
    if (!isFlipped || !curriculumTask) return;
    // В реальном режиме подменим на реальную проверку; пока — фиксируем успех
    submitResult(
      { taskId: Date.now(), topic: curriculumTask.topic },
      { isCorrect: true }
    );
  }, [isFlipped, curriculumMode, curriculumTask]);

  // Генерация похожей фразы через Gemini
  const generateSimilar = async () => {
    if (!phrase) return;

    setGeneratingSimilar(true);
    setError(null);
    setIsFlipped(false); // Сбрасываем переворот при новой фразе

    // Сбрасываем состояние чата при смене фразы
    setCurrentPhraseId(null);
    setShowChatModal(false);

    await generateSimilarPhrase({
      basePhrase: phrase,
      setter: ({ loading, data, error }) => {
        setGeneratingSimilar(!!loading);
        if (data) {
          setPhrase(data);
          // Устанавливаем ID новой фразы
          setCurrentPhraseId(`${data.german}-${data.russian}`);
        }
        setError(error);
      },
    });
  };

  // Переворот карточки
  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  // Озвучивание немецкой фразы
  const speakGerman = () => {
    if (phrase) {
      speak(phrase.german, "de-DE");
    }
  };

  // Открытие чата с Gemini
  const openChatWithGemini = () => {
    if (!phrase) return;

    console.log("Opening chat for phrase:", phrase);

    const initialMessage = `Объясни простым языком, почему немецкая фраза "${phrase.german}" переводится как "${phrase.russian}".

Обрати внимание на:
- Спряжение глагола
- Порядок слов  
- Грамматические особенности
- Логику перевода

Объяснение должно быть понятным для начинающих изучать немецкий язык (уровень A1-A2).`;

    setInitialChatMessage(initialMessage);
    setShowChatModal(true);
  };

  // Обработчик цитирования фразы
  const handleQuotePhrase = (quotedPhrase) => {
    setQuotedPhrases((prev) => [...prev, quotedPhrase]);
  };

  // Функции для свайпа
  const handleTouchStart = (e) => {
    if (loading || generatingSimilar) return;
    const touch = e.touches[0];
    setSwipeOffset(0);
    setIsSwiping(true);
    cardRef.current.startX = touch.clientX;
    cardRef.current.startY = touch.clientY;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping || loading || generatingSimilar) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - cardRef.current.startX;
    const deltaY = touch.clientY - cardRef.current.startY;

    // Проверяем, что свайп больше горизонтальный, чем вертикальный
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      setSwipeOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping || loading || generatingSimilar) return;

    const threshold = 100; // Минимальное расстояние для свайпа

    if (Math.abs(swipeOffset) > threshold) {
      // Свайп выполнен - загружаем новую фразу
      fetchPhrase();
    }

    // Сбрасываем состояние
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  // Поддержка мыши для десктопа
  const handleMouseDown = (e) => {
    if (loading || generatingSimilar) return;
    setSwipeOffset(0);
    setIsSwiping(true);
    cardRef.current.startX = e.clientX;
    cardRef.current.startY = e.clientY;
  };

  const handleMouseMove = (e) => {
    if (!isSwiping || loading || generatingSimilar) return;
    const deltaX = e.clientX - cardRef.current.startX;
    const deltaY = e.clientY - cardRef.current.startY;

    // Проверяем, что свайп больше горизонтальный, чем вертикальный
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setSwipeOffset(deltaX);
    }
  };

  const handleMouseUp = () => {
    if (!isSwiping || loading || generatingSimilar) return;

    const threshold = 100;

    if (Math.abs(swipeOffset) > threshold) {
      fetchPhrase();
    }

    setSwipeOffset(0);
    setIsSwiping(false);
  };

  const phraseTypes = [
    { value: "all", label: "Все фразы" },
    { value: "present", label: "Настоящее время" },
    { value: "past", label: "Прошедшее время" },
    { value: "future", label: "Будущее время" },
    { value: "question", label: "Вопросы" },
    { value: "negative", label: "Отрицания" },
  ];

  // Функция закрытия чата
  const closeChatModal = () => {
    setShowChatModal(false);
  };

  // Функция с повтором запроса (retry)
  async function fetchWithRetry(url, options, maxRetries = 3, delayMs = 500) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error("Ошибка API");
        return response;
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }
    throw lastError;
  }

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "2rem auto",
        textAlign: "center",
        padding: "0 1rem",
        // Отключаем выделение текста для фильтра по типам фраз
        userSelect: "none",
        // Убираем выделение кнопок при клике (outline и user-select)
        outline: "none",
      }}
    >
      {/* Заголовок с кнопкой возврата */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.5rem",
          position: "relative",
        }}
      >
        <button
          onClick={onBackToMain}
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.5rem",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            transition: "all 0.2s ease",
            width: "2.5rem",
            height: "2.5rem",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#f1f5f9";
            e.target.style.color = "#1e293b";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "none";
            e.target.style.color = "#64748b";
          }}
          title="Вернуться на главную"
        >
          <ChevronLeft size={24} />
        </button>

        <h2
          style={{
            color: "#1e293b",
            fontSize: "1.8rem",
            fontWeight: 600,
            margin: 0,
          }}
        >
          Тренировка фраз
        </h2>
      </div>

      {/* Фильтр по типам */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          gap: "0.5rem",
          justifyContent: "flex-start",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {phraseTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => {
              setSelectedType(type.value);
              // Автоматически загружаем новую фразу при смене типа
              setTimeout(() => fetchPhrase(), 100);
            }}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.9rem",
              borderRadius: "0.5rem",
              background:
                selectedType === type.value
                  ? "linear-gradient(90deg, #fbbf24 0%, #ef4444 100%)"
                  : "#f1f5f9",
              color: selectedType === type.value ? "#fff" : "#475569",
              border: "none",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow:
                selectedType === type.value
                  ? "0 2px 8px rgba(251, 191, 36, 0.3)"
                  : "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Переворачивающаяся карточка */}
      {loading || generatingSimilar ? (
        // Скелетон карточки во время загрузки или генерации AI
        <div
          style={{
            marginTop: "1.5rem",
            perspective: "1000px",
            minHeight: "400px",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "200px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "300px",
                height: "100%",
                padding: "1.5rem",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "0.8rem",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                top: "25px",
                left: "calc(50% - 150px - 25px)",
              }}
            >
              {/* Скелетон заголовка */}
              <div
                style={{
                  width: "60%",
                  height: "1.2rem",
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "0.3rem",
                  marginBottom: "1rem",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />

              {/* Скелетон основного текста */}
              <div
                style={{
                  width: "80%",
                  height: "1.4rem",
                  background: "rgba(255, 255, 255, 0.3)",
                  borderRadius: "0.3rem",
                  marginBottom: "0.5rem",
                  animation: "pulse 1.5s ease-in-out infinite 0.2s",
                }}
              />

              {/* Скелетон дополнительного текста */}
              <div
                style={{
                  width: "40%",
                  height: "0.9rem",
                  background: "rgba(255, 255, 255, 0.15)",
                  borderRadius: "0.3rem",
                  marginTop: "1rem",
                  animation: "pulse 1.5s ease-in-out infinite 0.4s",
                }}
              />
            </div>
          </div>
        </div>
      ) : phrase ? (
        <div
          style={{
            marginTop: "1.5rem",
            perspective: "1000px",
            minHeight: "400px",
          }}
        >
          <div
            ref={cardRef}
            onClick={flipCard}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              width: "100%",
              height: "200px",
              position: "relative",
              cursor: "pointer",
              transformStyle: "preserve-3d",
              transition: isSwiping ? "none" : "transform 0.6s ease",
              transform: `${
                isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
              } translateX(${swipeOffset}px)`,
              outline: "none",
              WebkitTapHighlightColor: "transparent",
              userSelect: "none",
              touchAction: "pan-y",
            }}
          >
            {/* Лицевая сторона (русский текст) */}
            <div
              style={{
                position: "absolute",
                width: "300px",
                height: "100%",
                backfaceVisibility: "hidden",
                padding: "1.5rem",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "0.8rem",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                top: "25px",
                left: "calc(50% - 150px - 25px)",
              }}
            >
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "300",
                  color: "white",
                  marginBottom: "0.5rem",
                  opacity: "0.8",
                }}
              >
                Переведите на немецкий:
              </div>
              <div
                style={{
                  fontSize: "1.4rem",
                  color: "white",
                  fontWeight: 600,
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {phrase.russian.split(/\s+/).map((word, idx) => {
                  const cleanWord = word.replace(/[.,!?;:]/g, "");
                  const punctuation = word.replace(/[^.,!?;:]/g, "");
                  return (
                    <span key={idx}>
                      <span
                        style={{
                          cursor: "pointer",
                          background:
                            selectedRuWord && selectedRuWord.id === idx
                              ? "#f1f5f9"
                              : "none",
                          color:
                            selectedRuWord && selectedRuWord.id === idx
                              ? "#2563eb"
                              : "white",
                          borderRadius: "0.2rem",
                          padding: "0.1rem 0.2rem",
                          fontWeight:
                            selectedRuWord && selectedRuWord.id === idx
                              ? 700
                              : 600,
                          transition: "all 0.2s",
                        }}
                        title={`Кликните для перевода слова "${cleanWord}"`}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setSelectedRuWord({ word: cleanWord, id: idx });
                          setShowRuWordInfo(true);
                          // Проверяем кеш
                          if (ruWordInfoCache[cleanWord]) {
                            setRuWordInfo({
                              loading: false,
                              data: ruWordInfoCache[cleanWord],
                              error: null,
                            });
                            return;
                          }
                          setRuWordInfo({
                            loading: true,
                            data: null,
                            error: null,
                          });
                          try {
                            const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
                            if (!apiKey)
                              throw new Error("API ключ не настроен");
                            const prompt = `\nДай краткую справку о русском слове "${cleanWord}" для изучающих немецкий язык (уровень A1-A2).\n\nФормат ответа в Markdown:\n\n## ${cleanWord}\n\n**Перевод на немецкий:** [перевод]\n\n**Часть речи:** [существительное/глагол/местоимение/прилагательное/наречие/предлог]\n\n**Примеры:**\n- [пример использования в немецком]\n- [ещё один пример]\n\n**Примечание:** [дополнительная информация, если нужно]\n\nОтвечай кратко и понятно, используй простой язык.`;
                            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
                            const options = {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                contents: [
                                  { role: "user", parts: [{ text: prompt }] },
                                ],
                                generationConfig: {
                                  temperature: 0.3,
                                  maxOutputTokens: 300,
                                },
                              }),
                            };
                            const response = await fetchWithRetry(
                              url,
                              options,
                              3,
                              500
                            );
                            const result = await response.json();
                            const text =
                              result.candidates[0].content.parts[0].text;
                            setRuWordInfoCache((prev) => ({
                              ...prev,
                              [cleanWord]: text,
                            }));
                            setRuWordInfo({
                              loading: false,
                              data: text,
                              error: null,
                            });
                          } catch (error) {
                            setRuWordInfo({
                              loading: false,
                              data: null,
                              error: "Не удалось получить перевод",
                            });
                          }
                        }}
                      >
                        {cleanWord}
                      </span>
                      {punctuation}
                      {idx < phrase.russian.split(/\s+/).length - 1 && " "}
                    </span>
                  );
                })}
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "300",
                  color: "white",
                  marginTop: "1rem",
                  fontStyle: "italic",
                  opacity: "0.7",
                }}
              >
                Нажмите для проверки
              </div>
            </div>

            {/* Обратная сторона (немецкий текст) */}
            <div
              style={{
                position: "absolute",
                width: "300px",
                height: "100%",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                padding: "1.5rem",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "0.8rem",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                position: "relative",
                top: "25px",
                left: "calc(50% - 150px - 25px)",
              }}
            >
              {/* Кнопки в правом нижнем углу */}
              <div
                style={{
                  position: "absolute",
                  bottom: "0.8rem",
                  right: "0.8rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  alignItems: "center",
                }}
              >
                {/* Кнопка озвучивания */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakGerman();
                  }}
                  disabled={isSpeaking}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    border: "none",
                    cursor: isSpeaking ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.5rem",
                    height: "2.5rem",
                    opacity: isSpeaking ? 0.7 : 1,
                    transition: "all 0.2s ease",
                    backdropFilter: "blur(10px)",
                  }}
                  title="Озвучить фразу"
                >
                  {isSpeaking ? (
                    <div
                      style={{
                        width: "1rem",
                        height: "1rem",
                        border: "2px solid transparent",
                        borderTop: "2px solid #fff",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  ) : (
                    <Volume2 size={16} />
                  )}
                </button>

                {/* Кнопка чата с Gemini */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openChatWithGemini();
                  }}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.5rem",
                    height: "2.5rem",
                    transition: "all 0.2s ease",
                    backdropFilter: "blur(10px)",
                  }}
                  title="Чат с Gemini"
                >
                  <HelpCircle size={16} />
                </button>

                {/* Кнопка генерации похожей фразы */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    generateSimilar();
                  }}
                  disabled={generatingSimilar}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    border: "none",
                    cursor: generatingSimilar ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.5rem",
                    height: "2.5rem",
                    opacity: generatingSimilar ? 0.7 : 1,
                    transition: "all 0.2s ease",
                    backdropFilter: "blur(10px)",
                  }}
                  title="Сгенерировать похожую фразу через AI"
                >
                  {generatingSimilar ? (
                    <div
                      style={{
                        width: "1rem",
                        height: "1rem",
                        border: "2px solid transparent",
                        borderTop: "2px solid #fff",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </button>
              </div>

              <div
                style={{
                  fontSize: "1.2rem",
                  opacity: "0.7",
                  color: "rgba(255, 255, 255, 0.9)",
                  marginBottom: "0.5rem",
                  fontWeight: 300,
                }}
              >
                Правильный ответ:
              </div>
              <div
                style={{
                  fontSize: "1.4rem",
                  color: "#fff",
                  fontWeight: 600,
                  textAlign: "center",
                  lineHeight: 1.4,
                  paddingRight: "3rem",
                  paddingLeft: "3rem",
                }}
              >
                <CardPhrase
                  phrase={phrase}
                  speak={speak}
                  isSpeaking={isSpeaking}
                />
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  opacity: "0.7",
                  color: "rgba(255, 255, 255, 0.8)",
                  marginTop: "1rem",
                  fontStyle: "italic",
                  fontWeight: "300",
                }}
              >
                Нажмите для возврата
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Отображение ошибки */}
      {error && (
        <div
          style={{
            color: "#ef4444",
            marginTop: "1rem",
            padding: "0.8rem",
            background: "#fef2f2",
            borderRadius: "0.5rem",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* Информация о выбранном типе */}
      {selectedType !== "all" && (
        <div
          style={{
            marginTop: "1rem",
            fontSize: "0.9rem",
            color: "#64748b",
          }}
        >
          Показываю фразы типа:{" "}
          <strong>
            {phraseTypes.find((t) => t.value === selectedType)?.label}
          </strong>
        </div>
      )}

      {/* Цитированные фразы */}
      {quotedPhrases.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3
            style={{
              fontSize: "1rem",
              color: "#374151",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            📝 Цитированные фразы ({quotedPhrases.length})
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.8rem",
              maxHeight: "200px",
              overflowY: "auto",
              padding: "1rem",
              background: "#f8fafc",
              borderRadius: "0.8rem",
              border: "1px solid #e2e8f0",
            }}
          >
            {quotedPhrases.map((quotedPhrase, index) => (
              <div
                key={index}
                style={{
                  padding: "0.8rem",
                  background: "white",
                  borderRadius: "0.5rem",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <InteractivePhrase
                  phrase={quotedPhrase}
                  onQuote={handleQuotePhrase}
                  speak={speak}
                  isSpeaking={isSpeaking}
                  disableClick={true}
                />
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#64748b",
                    marginTop: "0.5rem",
                    fontStyle: "italic",
                  }}
                >
                  {quotedPhrase.russian}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Подсказка о свайпе */}
      {phrase && !loading && !generatingSimilar && (
        <div
          style={{
            marginTop: "1rem",
            fontSize: "0.8rem",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem",
          }}
        >
          <span>←</span>
          <span>Свайпните для новой фразы</span>
          <span>→</span>
        </div>
      )}

      {/* Чат с Gemini */}
      <GeminiChatModal
        show={showChatModal}
        initialMessage={initialChatMessage}
        onClose={closeChatModal}
        phraseId={currentPhraseId}
      />

      {/* Модалка для перевода слова */}
      {showRuWordInfo && selectedRuWord && (
        <div className="word-info-modal">
          <div className="word-info-content">
            <div className="word-info-header">
              <h3>
                Перевод слова: <strong>{selectedRuWord.word}</strong>
              </h3>
              <button
                onClick={() => setShowRuWordInfo(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="word-info-body">
              {ruWordInfo?.loading && (
                <div className="word-info-loading">
                  <div className="loading-spinner"></div>
                  <span>Загружаем перевод...</span>
                </div>
              )}
              {ruWordInfo?.error && (
                <div className="word-info-error">{ruWordInfo.error}</div>
              )}
              {ruWordInfo?.data && (
                <div className="word-info-markdown">
                  <ReactMarkdown>{ruWordInfo.data}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
          <style>{`
            .word-info-modal {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 2000;
            }
            .word-info-content {
              background: white;
              border-radius: 0.8rem;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
              max-width: 500px;
              width: 90%;
              max-height: 80vh;
              overflow: hidden;
            }
            .word-info-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 1rem 1.5rem;
              border-bottom: 1px solid #e2e8f0;
            }
            .word-info-header h3 {
              margin: 0;
              font-size: 1.1rem;
              color: #1e293b;
            }
            .close-btn {
              background: none;
              border: none;
              color: #64748b;
              cursor: pointer;
              padding: 0.3rem;
              border-radius: 0.3rem;
              font-size: 1.3rem;
              transition: all 0.2s;
            }
            .close-btn:hover {
              background-color: #f1f5f9;
              color: #475569;
            }
            .word-info-body {
              padding: 1.5rem;
              max-height: 60vh;
              overflow-y: auto;
            }
            .word-info-loading {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              color: #64748b;
            }
            .loading-spinner {
              width: 1rem;
              height: 1rem;
              border: 2px solid #e2e8f0;
              border-top: 2px solid #2563eb;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .word-info-error {
              color: #dc2626;
              padding: 1rem;
              background: #fef2f2;
              border-radius: 0.5rem;
              border: 1px solid #fecaca;
            }
            .word-info-markdown {
              line-height: 1.6;
              font-size: 1rem;
              color: #1e293b;
            }
          `}</style>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Скрываем скроллбара */
        div::-webkit-scrollbar {
          display: none;
        }

        div {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Отключаем подсветку при клике */
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        /* Разрешаем выделение текста только в кнопках */
        button {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
}

export default PhraseTrainer;
