import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Volume2, X } from "lucide-react";

/**
 * Компонент для отображения немецкой фразы на карточке
 * Поддерживает только кликабельность слов для справки
 */
function CardPhrase({ phrase, speak, isSpeaking, onWordClick }) {
  // Разбиваем фразу на слова для интерактивности
  const words = phrase.german.split(/\s+/).map((word, index) => {
    // Убираем знаки препинания для определения слова
    const cleanWord = word.replace(/[.,!?;:]/g, "");
    const punctuation = word.replace(/[^.,!?;:]/g, "");

    return {
      id: index,
      word: cleanWord,
      punctuation,
      fullWord: word,
      startIndex: phrase.german.indexOf(word),
    };
  });

  // Обработчик клика по слову
  const handleWordClick = (e, wordData) => {
    e.stopPropagation();
    if (onWordClick) {
      onWordClick(wordData);
    }
  };

  return (
    <div className="card-phrase">
      {/* Основная фраза */}
      <div className="card-phrase-german">
        {words.map((wordData, index) => (
          <span key={wordData.id}>
            <span
              className="card-interactive-word"
              onClick={(e) => handleWordClick(e, wordData)}
              title={`Кликните для справки о слове "${wordData.word}"`}
            >
              {wordData.word}
            </span>
            {wordData.punctuation}
            {index < words.length - 1 && " "}
          </span>
        ))}
      </div>

      <style>{`
        .card-phrase {
          display: block;
          text-align: center;
        }

        .card-phrase-german {
          font-size: 1.6rem;
          font-weight: 600;
          color: #fff;
          line-height: 1.4;
          display: block;
        }

        .card-interactive-word {
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 0.2rem;
          padding: 0.1rem 0.2rem;
          opacity: 1;
        }

        .card-interactive-word:hover {
          background-color: rgba(255, 255, 255, 0.1);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

export default CardPhrase;
