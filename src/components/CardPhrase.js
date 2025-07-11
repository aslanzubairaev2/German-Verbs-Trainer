import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Volume2, X } from "lucide-react";

/**
 * Компонент для отображения немецкой фразы на карточке
 * Поддерживает только кликабельность слов для справки
 */
function CardPhrase({ phrase, speak, isSpeaking }) {
  // Кеш для справок по словам: { слово: справка }
  const [wordInfoCache, setWordInfoCache] = useState({});
  const [selectedWord, setSelectedWord] = useState(null);
  const [showWordInfo, setShowWordInfo] = useState(false);
  const [wordInfo, setWordInfo] = useState(null);
  const phraseRef = useRef(null);

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
    setSelectedWord(wordData);
    setShowWordInfo(true);

    // Проверяем кеш: если справка уже есть, показываем её сразу
    if (wordInfoCache[wordData.word]) {
      setWordInfo({
        loading: false,
        data: wordInfoCache[wordData.word],
        error: null,
      });
      return;
    }
    // Если нет — делаем запрос
    fetchWordInfo(wordData.word);
  };

  // Получение информации о слове через Gemini
  const fetchWordInfo = async (word) => {
    setWordInfo({ loading: true, data: null, error: null });

    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API ключ не настроен");
      }

      const prompt = `
        Дай краткую справку о немецком слове "${word}" для изучающих язык (уровень A1-A2).
        
        Формат ответа в Markdown:
        
        ## ${word}
        
        **Перевод:** [перевод на русский]
        
        **Часть речи:** [существительное/глагол/местоимение/прилагательное/наречие/предлог]
        
        **Грамматика:** [краткое объяснение грамматических особенностей]
        
        **Примеры:**
        - [пример использования]
        - [ещё один пример]
        
        **Примечание:** [дополнительная информация, если нужно]
        
        Отвечай кратко и понятно, используй простой язык.
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 300,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка API");
      }

      const result = await response.json();
      const text = result.candidates[0].content.parts[0].text;

      // Сохраняем справку в кеш
      setWordInfoCache((prev) => ({ ...prev, [word]: text }));
      setWordInfo({ loading: false, data: text, error: null });
    } catch (error) {
      console.error("Error fetching word info:", error);
      setWordInfo({
        loading: false,
        data: null,
        error: "Не удалось получить информацию о слове",
      });
    }
  };

  // Закрытие модального окна при клике вне его
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (phraseRef.current && !phraseRef.current.contains(e.target)) {
        setShowWordInfo(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="card-phrase" ref={phraseRef}>
      {/* Основная фраза */}
      <div className="card-phrase-german">
        {words.map((wordData, index) => (
          <span key={wordData.id}>
            <span
              className={`card-interactive-word${
                selectedWord && selectedWord.id === wordData.id
                  ? " selected"
                  : ""
              }`}
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

      {/* Модальное окно информации о слове */}
      {showWordInfo && selectedWord && (
        <div className="word-info-modal">
          <div className="word-info-content">
            <div className="word-info-header">
              <h3>
                Справка о слове: <strong>{selectedWord.word}</strong>
              </h3>
              <button
                onClick={() => setShowWordInfo(false)}
                className="close-btn"
              >
                <X size={16} />
              </button>
            </div>
            <div className="word-info-body">
              {wordInfo?.loading && (
                <div className="word-info-loading">
                  <div className="loading-spinner"></div>
                  <span>Загружаем информацию...</span>
                </div>
              )}

              {wordInfo?.error && (
                <div className="word-info-error">{wordInfo.error}</div>
              )}

              {wordInfo?.data && (
                <div className="word-info-markdown">
                  <ReactMarkdown
                    components={{
                      h2: ({ node, ...props }) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            margin: 0,
                          }}
                        >
                          <h2 style={{ margin: 0 }}>{props.children}</h2>
                          <button
                            onClick={() =>
                              speak && speak(selectedWord.word, "de-DE")
                            }
                            disabled={isSpeaking}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#64748b",
                              cursor: "pointer",
                              padding: "0.2rem",
                              borderRadius: "0.3rem",
                              transition: "all 0.2s",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginLeft: "0.3rem",
                              verticalAlign: "middle",
                            }}
                            title="Озвучить слово"
                          >
                            <Volume2 size={18} />
                          </button>
                        </div>
                      ),
                    }}
                  >
                    {wordInfo.data}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

        .card-interactive-word.selected {
          background-color: #f1f5f9;
          color: #2563eb;
          font-weight: 700;
          box-shadow: 0 0 0 2px #2563eb33;
        }

        .word-info-modal {
          /* Затемнение + flex-центрирование модального окна */
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
        position: fixed;
        // top: calc(50% - 200px);
          /* Обычный блочный элемент, центрируется flex-контейнером */
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
        .word-info-markdown h2, .word-info-markdown h3 {
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .word-info-markdown ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .word-info-markdown li {
          margin-bottom: 0.3rem;
        }
        .word-info-markdown code {
          background: #f1f5f9;
          color: #1e293b;
          padding: 0.1rem 0.3rem;
          border-radius: 0.3rem;
          font-size: 0.95em;
        }
        @media (max-width: 480px) {
          .word-info-content {
            width: 95%;
            margin: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default CardPhrase;
