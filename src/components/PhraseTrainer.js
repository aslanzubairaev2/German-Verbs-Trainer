import React, { useState, useCallback, useEffect } from "react";
import { fetchLocalPhrase } from "../api/phrases";
import { generateSimilarPhrase } from "../api/gemini";
import { Sparkles, Volume2, RotateCcw, ChevronLeft } from "lucide-react";

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

  const phraseTypes = [
    { value: "all", label: "Все фразы" },
    { value: "present", label: "Настоящее время" },
    { value: "past", label: "Прошедшее время" },
    { value: "future", label: "Будущее время" },
    { value: "question", label: "Вопросы" },
    { value: "negative", label: "Отрицания" },
  ];

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
          }}
        >
          <div
            onClick={flipCard}
            style={{
              width: "100%",
              height: "200px",
              position: "relative",
              cursor: "pointer",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s ease",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
              userSelect: "none",
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
              {/* Кнопка генерации похожей фразы */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  generateSimilar();
                }}
                disabled={generatingSimilar}
                style={{
                  position: "absolute",
                  top: "0.8rem",
                  right: "0.8rem",
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

              {/* Кнопка озвучивания */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakGerman();
                }}
                disabled={isSpeaking}
                style={{
                  position: "absolute",
                  top: "0.8rem",
                  left: "0.8rem",
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

        /* Скрываем скроллбар */
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
