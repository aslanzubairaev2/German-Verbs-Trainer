import React, { useState } from "react";
import { fetchLocalPhrase } from "../api/phrases";
import { generateSimilarPhrase } from "../api/gemini";
import { Sparkles } from "lucide-react";

/**
 * Компонент для тренировки немецких фраз из локального файла
 */
function PhraseTrainer() {
  const [loading, setLoading] = useState(false);
  const [phrase, setPhrase] = useState(null);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState("all");
  const [generatingSimilar, setGeneratingSimilar] = useState(false);

  // Получение фразы из локального файла
  const fetchPhrase = async () => {
    setLoading(true);
    setPhrase(null);
    setError(null);

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

  // Генерация похожей фразы через Gemini
  const generateSimilar = async () => {
    if (!phrase) return;

    setGeneratingSimilar(true);
    setError(null);

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
      }}
    >
      <h2
        style={{
          color: "#1e293b",
          marginBottom: "1.5rem",
          fontSize: "1.8rem",
          fontWeight: 600,
        }}
      >
        Тренировка фраз
      </h2>

      {/* Фильтр по типам */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          justifyContent: "center",
        }}
      >
        {phraseTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
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
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Кнопка получения фразы */}
      <button
        onClick={fetchPhrase}
        disabled={loading}
        style={{
          padding: "0.8rem 2.5rem",
          fontSize: "1.1rem",
          borderRadius: "0.7rem",
          background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
          color: "#fff",
          border: "none",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: "0 4px 16px rgba(59, 130, 246, 0.2)",
          marginBottom: "1.5rem",
          opacity: loading ? 0.7 : 1,
          transition: "all 0.2s ease",
        }}
      >
        {loading ? "Загружаю..." : "Получить фразу"}
      </button>

      {/* Отображение фразы */}
      {phrase && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1.5rem",
            background: "#f8fafc",
            borderRadius: "0.8rem",
            border: "1px solid #e2e8f0",
            animation: "fadeIn 0.3s ease",
            position: "relative",
          }}
        >
          {/* Кнопка генерации похожей фразы */}
          <button
            onClick={generateSimilar}
            disabled={generatingSimilar}
            style={{
              position: "absolute",
              top: "0.8rem",
              right: "0.8rem",
              padding: "0.5rem",
              borderRadius: "50%",
              background: "linear-gradient(90deg, #fbbf24 0%, #ef4444 100%)",
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
              boxShadow: "0 2px 8px rgba(251, 191, 36, 0.3)",
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

          <div
            style={{
              color: "#1e293b",
              marginBottom: "1rem",
              fontSize: "1.3rem",
              fontWeight: 500,
              lineHeight: 1.4,
              paddingRight: "3rem", // Место для кнопки
            }}
          >
            <span style={{ color: "#3b82f6", fontWeight: 600 }}>DE:</span>{" "}
            {phrase.german}
          </div>
          <div
            style={{
              color: "#475569",
              fontSize: "1.1rem",
              lineHeight: 1.4,
            }}
          >
            <span style={{ color: "#8b5cf6", fontWeight: 600 }}>RU:</span>{" "}
            {phrase.russian}
          </div>

          {/* Индикатор AI-генерации */}
          {generatingSimilar && (
            <div
              style={{
                position: "absolute",
                bottom: "0.8rem",
                right: "0.8rem",
                fontSize: "0.8rem",
                color: "#fbbf24",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Sparkles size={12} />
              AI генерирует...
            </div>
          )}
        </div>
      )}

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
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default PhraseTrainer;
