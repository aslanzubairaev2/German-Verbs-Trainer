import React, { useState, useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { fetchLocalPhrase } from "../api/phrases";
import { generateSimilarPhrase } from "../api/gemini";
import {
  Sparkles,
  Volume2,
  RotateCcw,
  ChevronLeft,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

/**
 * Компонент для тренировки немецких фраз из локального файла
 */
function PhraseTrainer({ onBackToMain }) {
  const [loading, setLoading] = useState(false);
  const [phrase, setPhrase] = useState(null);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState("all");
  const [generatingSimilar, setGeneratingSimilar] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [explanationText, setExplanationText] = useState("");
  const [generatingExplanation, setGeneratingExplanation] = useState(false);
  const [modalAnimation, setModalAnimation] = useState("closed");
  const cardRef = useRef(null);

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

  // Получение фразы из локального файла
  const fetchPhrase = async () => {
    setLoading(true);
    setPhrase(null);
    setError(null);
    setIsFlipped(false); // Сбрасываем переворот при новой фразе

    const filterType = selectedType === "all" ? null : selectedType;

    await fetchLocalPhrase({
      setter: ({ loading, data, error }) => {
        setLoading(!!loading);
        setPhrase(data);
        setError(error);
      },
      filterType,
    });
  };

  // Автоматическая загрузка фразы при монтировании компонента
  useEffect(() => {
    fetchPhrase();
  }, []); // Пустой массив зависимостей - выполняется только при монтировании

  // Генерация похожей фразы через Gemini
  const generateSimilar = async () => {
    if (!phrase) return;

    setGeneratingSimilar(true);
    setError(null);
    setIsFlipped(false); // Сбрасываем переворот при новой фразе

    await generateSimilarPhrase({
      basePhrase: phrase,
      setter: ({ loading, data, error }) => {
        setGeneratingSimilar(!!loading);
        if (data) {
          setPhrase(data);
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

  // Генерация пояснения через Gemini
  const generateExplanation = async () => {
    if (!phrase || generatingExplanation) return;

    setGeneratingExplanation(true);
    setExplanationText("");
    setShowExplanationModal(true);
    setModalAnimation("opening");

    // Запускаем анимацию открытия
    setTimeout(() => {
      setModalAnimation("open");
    }, 10);

    const prompt = `
      Объясни простым языком, почему немецкая фраза "${phrase.german}" переводится как "${phrase.russian}".
      
      Обрати внимание на:
      - Спряжение глагола
      - Порядок слов
      - Грамматические особенности
      - Логику перевода
      
      Объяснение должно быть понятным для начинающих изучать немецкий язык (уровень A1-A2).
      Пиши кратко, но информативно.
    `;

    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) {
        setExplanationText("API ключ не настроен");
        setGeneratingExplanation(false);
        return;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 200,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      const explanation =
        result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "Не удалось получить пояснение";
      setExplanationText(explanation);
    } catch (error) {
      console.error("Generate Explanation Error:", error);
      setExplanationText("Не удалось получить пояснение");
    } finally {
      setGeneratingExplanation(false);
    }
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

  // Функция закрытия модального окна с анимацией
  const closeExplanationModal = () => {
    setModalAnimation("closing");
    setTimeout(() => {
      setShowExplanationModal(false);
      setModalAnimation("closed");
    }, 300);
  };

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
                {phrase.russian}
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

                {/* Кнопка пояснения */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    generateExplanation();
                  }}
                  disabled={generatingExplanation}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    border: "none",
                    cursor: generatingExplanation ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.5rem",
                    height: "2.5rem",
                    opacity: generatingExplanation ? 0.7 : 1,
                    transition: "all 0.2s ease",
                    backdropFilter: "blur(10px)",
                  }}
                  title="Получить пояснение"
                >
                  {generatingExplanation ? (
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
                    <HelpCircle size={16} />
                  )}
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
                {phrase.german}
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

      {/* Модальное окно пояснений */}
      {showExplanationModal && (
        <div
          className={`explanation-modal ${modalAnimation}`}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "50vh",
            background: "#fff",
            borderTopLeftRadius: "1rem",
            borderTopRightRadius: "1rem",
            boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            willChange: "transform, opacity",
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            e.currentTarget.startY = touch.clientY;
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const deltaY = touch.clientY - e.currentTarget.startY;
            if (deltaY > 0) {
              e.currentTarget.style.transform = `translateY(${deltaY}px)`;
            }
          }}
          onTouchEnd={(e) => {
            const touch = e.changedTouches[0];
            const deltaY = touch.clientY - e.currentTarget.startY;
            if (deltaY > 100) {
              closeExplanationModal();
            } else {
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
          onMouseDown={(e) => {
            e.currentTarget.startY = e.clientY;
            e.currentTarget.isDragging = true;
          }}
          onMouseMove={(e) => {
            if (e.currentTarget.isDragging) {
              const deltaY = e.clientY - e.currentTarget.startY;
              if (deltaY > 0) {
                e.currentTarget.style.transform = `translateY(${deltaY}px)`;
              }
            }
          }}
          onMouseUp={(e) => {
            if (e.currentTarget.isDragging) {
              const deltaY = e.clientY - e.currentTarget.startY;
              if (deltaY > 100) {
                closeExplanationModal();
              } else {
                e.currentTarget.style.transform = "translateY(0)";
              }
              e.currentTarget.isDragging = false;
            }
          }}
          onMouseLeave={(e) => {
            if (e.currentTarget.isDragging) {
              const deltaY = e.clientY - e.currentTarget.startY;
              if (deltaY > 100) {
                closeExplanationModal();
              } else {
                e.currentTarget.style.transform = "translateY(0)";
              }
              e.currentTarget.isDragging = false;
            }
          }}
        >
          {/* Заголовок с кнопкой закрытия */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem 1.5rem",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#1e293b",
              }}
            >
              Пояснение к фразе
            </h3>
            <button
              onClick={closeExplanationModal}
              style={{
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
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#f1f5f9";
                e.target.style.color = "#1e293b";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "none";
                e.target.style.color = "#64748b";
              }}
            >
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Контент */}
          <div
            style={{
              flex: 1,
              padding: "1.5rem",
              overflowY: "auto",
            }}
          >
            {generatingExplanation ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#64748b",
                }}
              >
                <div
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    border: "2px solid transparent",
                    borderTop: "2px solid #64748b",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginRight: "0.5rem",
                  }}
                />
                Генерирую пояснение...
              </div>
            ) : (
              <div className="explanation-markdown">
                <ReactMarkdown>
                  {explanationText ||
                    "Нажмите кнопку пояснения для получения объяснения"}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
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

        .explanation-modal.closed {
          transform: translateY(100%);
          opacity: 0;
          pointer-events: none;
        }
        .explanation-modal.opening {
          transform: translateY(100%);
          opacity: 1;
        }
        .explanation-modal.open {
          transform: translateY(0);
          opacity: 1;
          transition: transform 0.3s cubic-bezier(0.4, 1.3, 0.6, 1),
            opacity 0.3s;
        }
        .explanation-modal.closing {
          transform: translateY(100%);
          opacity: 0;
          transition: transform 0.3s, opacity 0.3s;
        }
        .explanation-markdown {
          font-size: 1rem;
          line-height: 1.7;
          color: #374151;
        }
        .explanation-markdown p {
          margin: 0 0 1.1em 0;
          padding: 0;
          text-indent: 1.2em;
        }
        .explanation-markdown ul,
        .explanation-markdown ol {
          margin: 0 0 1.1em 1.5em;
          padding: 0;
        }
        .explanation-markdown li {
          margin-bottom: 0.5em;
        }
        .explanation-markdown strong {
          color: #7c3aed;
        }
        .explanation-markdown em {
          color: #a21caf;
        }
        .explanation-markdown code {
          background: #f3f4f6;
          color: #7c3aed;
          border-radius: 0.3em;
          padding: 0.1em 0.3em;
          font-size: 0.95em;
        }
        .explanation-markdown blockquote {
          border-left: 3px solid #a5b4fc;
          margin: 0 0 1em 0;
          padding: 0.5em 1em;
          color: #6366f1;
          background: #f8fafc;
          border-radius: 0.5em;
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
