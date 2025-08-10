import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Volume2, Quote, Eye, HelpCircle, X } from "lucide-react";

/**
 * Компонент для интерактивного отображения немецких фраз
 * Поддерживает цитирование, перевод и справку по словам
 */
function InteractivePhrase({
  phrase,
  onQuote,
  speak,
  isSpeaking,
  disableSpeak,
  disableHover,
  disableClick,
}) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showWordInfo, setShowWordInfo] = useState(false);
  const [wordInfo, setWordInfo] = useState(null);
  const [actionsPosition, setActionsPosition] = useState({ x: 0, y: 0 });
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

  // Обработчик клика по фразе
  const handlePhraseClick = (e) => {
    console.log("InteractivePhrase clicked:", {
      phrase: phrase.german,
      disableClick,
    });
    if (disableClick) return;

    const rect = phraseRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log("Setting actions menu at:", { x, y });
    setActionsPosition({ x, y });
    setShowActions(true);
    setShowTranslation(false);
    setShowWordInfo(false);
  };

  // Обработчик клика по слову
  const handleWordClick = (e, wordData) => {
    if (disableClick) return;

    e.stopPropagation();
    setSelectedWord(wordData);
    setShowWordInfo(true);
    setShowActions(false);
    setShowTranslation(false);

    // Получаем информацию о слове
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
        
        ВАЖНО: 
        - Если это глагол, покажи инфинитив на немецком языке
        - Если это существительное, покажи форму с артиклем в единственном числе (der/die/das)
        - Если это НЕ существительное, НЕ включай раздел "Форма с артиклем" вообще
        
        Формат ответа в Markdown:
        
        ## ${word}
        
        **Перевод:** [перевод на русский]
        
        **Часть речи:** [существительное/глагол/местоимение/прилагательное/наречие/предлог]
        
        **Инфинитив (нем.):** [инфинитив для глаголов]
        
        **Грамматика:** [краткое объяснение грамматических особенностей]
        
        **Примеры:**
        - [немецкая фраза] ([русский перевод])
        - [немецкая фраза] ([русский перевод])
        - [немецкая фраза] ([русский перевод])
        - [немецкая фраза] ([русский перевод])
        
        Отвечай кратко и понятно, используй простой язык.
        
        ПРИМЕЧАНИЕ: Раздел "Форма с артиклем" включай ТОЛЬКО для существительных.
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

  // Обработчик цитирования
  const handleQuote = () => {
    if (onQuote) {
      onQuote(phrase);
    }
    setShowActions(false);
  };

  // Обработчик показа перевода
  const handleShowTranslation = () => {
    setShowTranslation(true);
    setShowActions(false);
  };

  // Обработчик озвучивания
  const handleSpeak = () => {
    if (speak) {
      speak(phrase.german, "de-DE");
    }
    setShowActions(false);
  };

  // Закрытие всех модальных окон при клике вне их
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (phraseRef.current && !phraseRef.current.contains(e.target)) {
        setShowActions(false);
        setShowTranslation(false);
        setShowWordInfo(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`interactive-phrase${disableHover ? " no-hover" : ""}`}
      ref={phraseRef}
      style={{ position: "relative" }}
    >
      {/* Основная фраза */}
      <div
        className="phrase-german"
        onClick={handlePhraseClick}
        style={{ cursor: disableClick ? "default" : "pointer" }}
      >
        {words.map((wordData, index) => (
          <span key={wordData.id}>
            <span
              className={`interactive-word${disableHover ? " no-hover" : ""}${
                disableClick ? " no-click" : ""
              }`}
              onClick={(e) => handleWordClick(e, wordData)}
              title={
                disableClick
                  ? undefined
                  : `Кликните для справки о слове "${wordData.word}"`
              }
              style={disableHover ? { background: "none" } : {}}
            >
              {wordData.word}
            </span>
            {wordData.punctuation}
            {index < words.length - 1 && " "}
          </span>
        ))}
      </div>

      {/* Кнопка озвучивания */}
      {!disableSpeak && (
        <button
          className="phrase-speak-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleSpeak();
          }}
          disabled={isSpeaking}
          title="Озвучить фразу"
        >
          <Volume2 size={16} />
        </button>
      )}

      {/* Меню действий */}
      {console.log(
        "showActions state:",
        showActions,
        "for phrase:",
        phrase.german
      )}
      {showActions && (
        <div
          className="phrase-actions-menu"
          style={{
            left: `${actionsPosition.x}px`,
            top: `${actionsPosition.y}px`,
            zIndex: 9999,
          }}
        >
          <button onClick={handleQuote} className="action-btn quote-btn">
            <Quote size={14} />
            <span>Цитировать</span>
          </button>
          <button
            onClick={handleShowTranslation}
            className="action-btn translate-btn"
          >
            <Eye size={14} />
            <span>Показать перевод</span>
          </button>
          {!disableSpeak && (
            <button
              onClick={handleSpeak}
              className="action-btn speak-btn"
              disabled={isSpeaking}
            >
              <Volume2 size={14} />
              <span>Озвучить</span>
            </button>
          )}
        </div>
      )}

      {/* Модальное окно перевода */}
      {showTranslation && (
        <div className="phrase-translation-modal">
          <div className="translation-modal-content">
            <div className="translation-modal-header">
              <h3>Перевод фразы</h3>
              <button
                onClick={() => setShowTranslation(false)}
                className="close-btn"
              >
                <X size={16} />
              </button>
            </div>
            <div className="translation-content">
              <div className="translation-german">
                <strong>Немецкий:</strong> {phrase.german}
              </div>
              <div className="translation-russian">
                <strong>Русский:</strong> {phrase.russian}
              </div>
              {phrase.type && (
                <div className="translation-type">
                  <strong>Тип:</strong> {phrase.type}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                  {/* Кастомный рендер h2 для добавления кнопки озвучивания */}
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
                      li: ({ children, ...props }) => {
                        const text = children?.toString() || "";

                        // Сначала очищаем от лишних скобок в конце
                        let cleanText = text.replace(/\)+$/, "");

                        // Проверяем, не является ли весь текст в скобках
                        if (
                          cleanText.startsWith("(") &&
                          cleanText.includes(")") &&
                          !cleanText.includes("(")
                        ) {
                          // Ищем немецкую фразу внутри скобок
                          const content = cleanText.substring(
                            1,
                            cleanText.lastIndexOf(")")
                          );
                          // Ищем где заканчивается немецкая фраза и начинается русский текст
                          const germanEndMatch = content.match(
                            /([A-Za-zÄÖÜäöüß\s?!]+?)\s+([А-Яа-я\s]+)/
                          );
                          if (germanEndMatch) {
                            const germanText = germanEndMatch[1].trim();
                            const russianText = germanEndMatch[2].trim();
                            cleanText = `${germanText} (${russianText})`;
                          }
                        }

                        // Ищем немецкую фразу: может быть с точкой или без, затем пробел и возможно скобка
                        let germanMatch = cleanText.match(
                          /([A-Za-zÄÖÜäöüß\s?!]+?)(?:\s*\.)?\s*(?:\(|$)/
                        );

                        // Если не нашли немецкую фразу в начале, ищем её после скобки
                        if (!germanMatch && cleanText.startsWith("(")) {
                          const afterBracket = cleanText.substring(1);
                          germanMatch = afterBracket.match(
                            /([A-Za-zÄÖÜäöüß\s?!]+?)(?:\s*\.)?\s*\(/
                          );
                          if (germanMatch) {
                            // Перестраиваем текст в правильном формате
                            const germanText = germanMatch[1].trim();
                            const restText = afterBracket.substring(
                              germanMatch[0].length
                            );
                            cleanText = `${germanText} (${restText}`;
                            germanMatch = cleanText.match(
                              /([A-Za-zÄÖÜäöüß\s?!]+?)(?:\s*\.)?\s*(?:\(|$)/
                            );
                          }
                        }

                        // Если все еще не нашли, ищем немецкую фразу перед русским текстом
                        if (!germanMatch) {
                          // Ищем немецкую фразу, за которой сразу идет русский текст
                          germanMatch = cleanText.match(
                            /([A-Za-zÄÖÜäöüß\s?!]+?)(?:\s*\.)?\s+([А-Яа-я\s]+)/
                          );
                          if (germanMatch) {
                            const germanText = germanMatch[1].trim();
                            const russianText = germanMatch[2].trim();
                            cleanText = `${germanText} (${russianText})`;
                            germanMatch = cleanText.match(
                              /([A-Za-zÄÖÜäöüß\s?!]+?)(?:\s*\.)?\s*(?:\(|$)/
                            );
                          }
                        }

                        if (germanMatch) {
                          const germanText = germanMatch[1].trim();
                          // Получаем текст после немецкой фразы
                          const restText = cleanText
                            .replace(germanMatch[0], "")
                            .trim();

                          // Очищаем от лишних скобок и форматируем
                          let formattedText = restText;

                          // Убираем лишние закрывающие скобки в конце
                          formattedText = formattedText.replace(/\)+$/, "");

                          // Если текст не начинается со скобки, добавляем её
                          if (!formattedText.startsWith("(")) {
                            formattedText = `(${formattedText})`;
                          }

                          return (
                            <li
                              {...props}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                              }}
                            >
                              <button
                                onClick={() =>
                                  speak && speak(germanText, "de-DE")
                                }
                                disabled={isSpeaking}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#2563eb",
                                  cursor: "pointer",
                                  padding: "0.1rem",
                                  borderRadius: "0.2rem",
                                  fontSize: "0.9em",
                                  flexShrink: 0,
                                }}
                                title="Озвучить пример"
                              >
                                🔊
                              </button>
                              <span>
                                <span style={{ textDecoration: "underline" }}>
                                  {germanText}
                                </span>
                                {" " + formattedText}
                              </span>
                            </li>
                          );
                        }
                        return <li {...props}>{children}</li>;
                      },
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
        .interactive-phrase-container {
          position: relative;
          display: inline-block;
        }

        .interactive-phrase {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: background-color 0.2s;
        }

        .interactive-phrase:hover {
          background-color: #f8fafc;
        }

        .phrase-german {
          font-size: 1.1rem;
          font-weight: 500;
          color: inherit;
          line-height: 1.5;
        }

        .interactive-word {
          color: inherit;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 0.2rem;
          padding: 0.1rem 0.2rem;
          opacity: 0.9;
        }

        .interactive-word:hover {
          background-color: rgba(255, 255, 255, 0.2);
          text-decoration: underline;
          opacity: 1;
        }

        .phrase-speak-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.3rem;
          border-radius: 0.3rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .phrase-speak-btn:hover {
          background-color: #e2e8f0;
          color: #475569;
        }

        .phrase-speak-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .phrase-actions-menu {
          position: absolute;
          z-index: 1000;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 150px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          padding: 0.5rem;
          border-radius: 0.3rem;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
          color: #475569;
        }

        .action-btn:hover {
          background-color: #f1f5f9;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quote-btn:hover {
          color: #2563eb;
        }

        .translate-btn:hover {
          color: #059669;
        }

        .speak-btn:hover {
          color: #dc2626;
        }

        .phrase-translation-modal,
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

        .translation-modal-content,
        .word-info-content {
          background: white;
          border-radius: 0.8rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
        }

        .translation-modal-header,
        .word-info-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .translation-modal-header h3,
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

        .word-info-header button:hover {
          background-color: #f1f5f9;
          color: #475569;
        }

        .word-info-header button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .translation-content {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .translation-german,
        .translation-russian,
        .translation-type {
          padding: 0.8rem;
          background: #f8fafc;
          border-radius: 0.5rem;
          border-left: 3px solid #2563eb;
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
        }

        .word-info-markdown h2 {
          color: #1e293b;
          font-size: 1.2rem;
          margin: 1rem 0 0.5rem 0;
          padding-bottom: 0.3rem;
          border-bottom: 2px solid #2563eb;
        }

        .word-info-markdown h3 {
          color: #374151;
          font-size: 1rem;
          margin: 0.8rem 0 0.3rem 0;
        }

        .word-info-markdown strong {
          color: #1e293b;
          font-weight: 600;
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
          font-size: 0.9rem;
        }

        @media (max-width: 480px) {
          .translation-modal-content,
          .word-info-content {
            width: 95%;
            margin: 1rem;
          }
          
          .phrase-actions-menu {
            min-width: 120px;
          }
          
          .action-btn {
            font-size: 0.8rem;
            padding: 0.4rem;
          }
        }

        .interactive-phrase.no-hover:hover,
        .interactive-word.no-hover:hover {
          background: none !important;
          color: inherit !important;
          text-decoration: none !important;
          opacity: 1 !important;
        }

        .interactive-word.no-click {
          cursor: default !important;
          pointer-events: none !important;
        }


      `}</style>
    </div>
  );
}

export default InteractivePhrase;
