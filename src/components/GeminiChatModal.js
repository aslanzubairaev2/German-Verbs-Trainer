import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { fetchGeminiChat } from "../api/gemini.js";
import InteractivePhrase from "./InteractivePhrase.js";

function GeminiChatModal({ show, initialMessage, onClose, phraseId }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lastPhraseId, setLastPhraseId] = useState(null);
  const [quotedPhrases, setQuotedPhrases] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Управление состоянием чата
  useEffect(() => {
    // Если фраза изменилась — сбросить чат
    if (phraseId && phraseId !== lastPhraseId) {
      setMessages([]);
      setInputText("");
      setIsLoading(false);
      setIsRecording(false);
      setQuotedPhrases([]);
      setLastPhraseId(phraseId);
    }
  }, [phraseId, lastPhraseId]);

  // Первичная генерация пояснения при открытии
  useEffect(() => {
    if (!show) return;
    if (!initialMessage) return;
    if (messages.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const response = await fetchGeminiChat({
          message: initialMessage,
          conversationHistory: [],
        });
        if (cancelled) return;
        setMessages([
          {
            id: Date.now(),
            type: "assistant",
            content: response,
            timestamp: new Date(),
          },
        ]);
      } catch (e) {
        if (cancelled) return;
        setMessages([
          {
            id: Date.now(),
            type: "assistant",
            content:
              "Извините, не удалось получить объяснение. Попробуйте ещё раз.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [show, initialMessage, messages.length]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (show) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [show]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // Формируем контент сообщения с цитированными фразами
    let messageContent = inputText.trim();
    if (quotedPhrases.length > 0) {
      const quotedText = quotedPhrases
        .map((phrase) => `"${phrase.german}"`)
        .join(", ");
      messageContent = `Цитирую: ${quotedText} ${messageContent}`;
    }

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setQuotedPhrases([]); // Очищаем цитированные фразы после отправки
    setIsLoading(true);

    try {
      const response = await fetchGeminiChat({
        message: inputText.trim(),
        conversationHistory: messages,
      });

      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: "Извините, произошла ошибка. Попробуйте ещё раз.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startVoiceRecording = () => {
    if (!navigator.mediaDevices || !window.webkitSpeechRecognition) {
      alert("Голосовой ввод не поддерживается в вашем браузере");
      return;
    }

    setIsRecording(true);
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleClose = () => {
    setInputText("");
    setQuotedPhrases([]);
    onClose();
  };

  // Обработчик цитирования фразы
  const handleQuotePhrase = (quotedPhrase) => {
    setQuotedPhrases((prev) => [...prev, quotedPhrase]);
  };

  // Функция озвучивания для чата
  const speak = useCallback((text, lang = "de-DE") => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsRecording(false);
    utterance.onend = () => setIsRecording(false);
    utterance.onerror = () => setIsRecording(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  // Функция для извлечения немецких фраз из текста
  const extractGermanPhrases = (text) => {
    console.log("Extracting phrases from:", text.substring(0, 200));
    const phrases = [];

    // Ищем фразы в кавычках
    const quotedPhrases = text.match(/"([^"]+)"/g);
    if (quotedPhrases) {
      quotedPhrases.forEach((phrase) => {
        const cleanPhrase = phrase.replace(/"/g, "");
        console.log("Found quoted phrase:", cleanPhrase);
        // Добавляем только если есть хотя бы одно латинское слово с заглавной буквы (немецкое слово/фраза)
        const hasGermanWord = /\b[A-ZÄÖÜ][a-zäöüß]+\b/.test(cleanPhrase);
        const hasRussianChars = /[а-яА-ЯЁё]/.test(cleanPhrase);
        console.log("Checking quoted phrase:", cleanPhrase, {
          hasGermanWord,
          hasRussianChars,
        });
        if (hasGermanWord && !hasRussianChars) {
          console.log("Adding quoted phrase:", cleanPhrase);
          phrases.push({
            german: cleanPhrase,
            russian: "Перевод будет добавлен",
            type: "example",
          });
        }
      });
    }

    // Ищем фразы в коде (между `)
    const codePhrases = text.match(/`([^`]+)`/g);
    if (codePhrases) {
      codePhrases.forEach((phrase) => {
        const cleanPhrase = phrase.replace(/`/g, "");
        if (
          /\b[A-ZÄÖÜ][a-zäöüß]+\b/.test(cleanPhrase) &&
          !/[а-яА-ЯЁё]/.test(cleanPhrase)
        ) {
          phrases.push({
            german: cleanPhrase,
            russian: "Перевод будет добавлен",
            type: "example",
          });
        }
      });
    }

    // Ищем немецкие фразы с заглавной буквы (более гибкий паттерн)
    const germanPhraseRegex = /([A-ZÄÖÜ][a-zäöüß\s]+[.!?]?)/g;
    let match;
    while ((match = germanPhraseRegex.exec(text)) !== null) {
      const phrase = match[1].trim();
      console.log("Found German phrase:", phrase);
      if (
        phrase.length > 2 &&
        /\b[A-ZÄÖÜ][a-zäöüß]+\b/.test(phrase) &&
        !/[а-яА-ЯЁё]/.test(phrase) &&
        !phrases.some((p) => p.german === phrase)
      ) {
        phrases.push({
          german: phrase,
          russian: "Перевод будет добавлен",
          type: "example",
        });
      }
    }

    // Ищем отдельные немецкие слова с заглавной буквы
    const germanWords = text.match(/\b[A-ZÄÖÜ][a-zäöüß]+\b/g);
    if (germanWords) {
      germanWords.forEach((word) => {
        if (
          word.length > 2 &&
          !/[а-яА-ЯЁё]/.test(word) &&
          !phrases.some((p) => p.german === word) &&
          !["Ich", "Du", "Er", "Sie", "Wir", "Ihr", "Es"].includes(word)
        ) {
          phrases.push({
            german: word,
            russian: "Перевод будет добавлен",
            type: "word",
          });
        }
      });
    }

    console.log(
      "Final extracted phrases:",
      phrases.map((p) => ({ german: p.german, type: p.type }))
    );
    return phrases;
  };

  // Функция для рендеринга сообщения с интерактивными фразами
  const renderMessageContent = (content, isUser) => {
    console.log("Rendering message:", {
      content: content.substring(0, 100),
      isUser,
    });
    // Если это пользовательское сообщение с цитатой
    if (isUser && content.startsWith("Цитирую:")) {
      // Выделяем цитату и основной текст
      const match = content.match(
        /^Цитирую: ([^"]*"[^"]+"(?:, "[^"]+")*)\s*(.*)$/
      );
      if (match) {
        const quoted = match[1];
        const rest = match[2];
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <span
              style={{
                background: "#f1f5f9",
                color: "#64748b",
                borderRadius: "0.4rem",
                padding: "0.2rem 0.7rem",
                fontStyle: "italic",
                fontSize: "0.95em",
                marginBottom: rest ? "0.3rem" : 0,
                maxWidth: "100%",
                wordBreak: "break-word",
                cursor: "default",
                userSelect: "text",
              }}
            >
              Цитирую: {quoted}
            </span>
            {rest && <ReactMarkdown>{rest}</ReactMarkdown>}
          </div>
        );
      }
    }

    // Обычная логика для интерактивных фраз
    const germanPhrases = extractGermanPhrases(content);
    console.log("Extracted phrases:", germanPhrases);
    if (germanPhrases.length === 0) {
      return <ReactMarkdown>{content}</ReactMarkdown>;
    }
    let processedContent = content;
    let phraseIndex = 0;
    germanPhrases.forEach((phrase) => {
      const phraseRegex = new RegExp(
        `(${phrase.german.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "g"
      );
      processedContent = processedContent.replace(phraseRegex, (match) => {
        return `__INTERACTIVE_PHRASE_${phraseIndex}__`;
      });
      phraseIndex++;
    });
    const parts = processedContent.split(/__INTERACTIVE_PHRASE_(\d+)__/);
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        if (parts[i]) {
          result.push(
            <ReactMarkdown key={`text-${i}`}>{parts[i]}</ReactMarkdown>
          );
        }
      } else {
        const phraseIndex = parseInt(parts[i]);
        const phrase = germanPhrases[phraseIndex];
        console.log("Rendering InteractivePhrase:", {
          phraseIndex,
          phrase: { german: phrase.german, type: phrase.type },
        });
        if (phrase) {
          result.push(
            <InteractivePhrase
              key={`phrase-${phraseIndex}-${i}`}
              phrase={phrase}
              onQuote={handleQuotePhrase}
              speak={speak}
              isSpeaking={isRecording}
              disableHover={false}
              disableClick={false}
            />
          );
        }
      }
    }
    return result;
  };

  if (!show) return null;

  return (
    <div className="gemini-chat-modal-container">
      <div className="gemini-chat-modal-card slide-up">
        {/* Заголовок */}
        <div className="gemini-chat-modal-header">
          <div className="gemini-chat-modal-title">
            <div className="gemini-avatar">
              <img src="/gemini-icon.svg" alt="Gemini" width="24" height="24" />
            </div>
            <span>Gemini</span>
          </div>
          <button className="gemini-chat-close-btn" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Область сообщений */}
        <div className="gemini-chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`gemini-message ${
                message.type === "user" ? "user" : "assistant"
              }`}
            >
              <div className="gemini-message-content">
                {message.type === "assistant" && (
                  <div className="gemini-message-avatar">
                    <img
                      src="/gemini-icon.svg"
                      alt="Gemini"
                      width="16"
                      height="16"
                    />
                  </div>
                )}
                <div className="gemini-message-text">
                  {renderMessageContent(
                    message.content,
                    message.type === "user"
                  )}
                </div>
              </div>
              <div className="gemini-message-time">
                {message.timestamp.toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="gemini-message assistant">
              <div className="gemini-message-content">
                <div className="gemini-message-avatar">
                  <img
                    src="/gemini-icon.svg"
                    alt="Gemini"
                    width="16"
                    height="16"
                  />
                </div>
                <div className="gemini-message-text">
                  <div className="gemini-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Цитированные фразы */}
        {quotedPhrases.length > 0 && (
          <div className="quoted-phrases-section">
            <div className="quoted-phrases-header">
              <span>📝 Цитированные фразы ({quotedPhrases.length})</span>
            </div>
            <div className="quoted-phrases-list">
              {quotedPhrases.map((quotedPhrase, index) => (
                <div key={index} className="quoted-phrase-item">
                  <InteractivePhrase
                    phrase={quotedPhrase}
                    onQuote={handleQuotePhrase}
                    speak={speak}
                    isSpeaking={isRecording}
                    disableClick={true}
                  />
                  <div className="quoted-phrase-translation">
                    {quotedPhrase.russian}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Поле ввода */}
        <div className="gemini-chat-input-container">
          {/* Показываем цитированные фразы над полем ввода */}
          {quotedPhrases.length > 0 && (
            <div
              style={{
                padding: "0.5rem 0",
                fontSize: "0.8rem",
                color: "#64748b",
                borderBottom: "1px solid #e2e8f0",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ fontWeight: "600" }}>📝 Цитирую:</span>{" "}
              {quotedPhrases.map((phrase, index) => (
                <span
                  key={index}
                  style={{
                    background: "#f1f5f9",
                    padding: "0.2rem 0.4rem",
                    borderRadius: "0.3rem",
                    marginRight: "0.3rem",
                    fontStyle: "italic",
                  }}
                >
                  "{phrase.german}"
                </span>
              ))}
            </div>
          )}
          <div className="gemini-chat-input-wrapper">
            <textarea
              ref={inputRef}
              className="gemini-chat-input"
              placeholder="Спросить Gemini"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="1"
              disabled={isLoading}
            />
            <div className="gemini-chat-input-buttons">
              <button
                className={`gemini-voice-btn ${isRecording ? "recording" : ""}`}
                onClick={startVoiceRecording}
                disabled={isLoading}
                title="Голосовой ввод"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M19 10v2a7 7 0 0 1-14 0v-2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="12"
                    y1="19"
                    x2="12"
                    y2="23"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="8"
                    y1="23"
                    x2="16"
                    y2="23"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </button>
              <button
                className="gemini-send-btn"
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                title="Отправить"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .gemini-chat-modal-container {
          position: fixed;
          left: 0; right: 0; bottom: 0;
          z-index: 100;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          pointer-events: none;
        }
        
        .gemini-chat-modal-card {
          width: 100vw;
          max-width: 500px;
          height: 70vh;
          border-radius: 1.2rem 1.2rem 0 0;
          background: #fff;
          box-shadow: 0 -8px 32px rgba(37,99,235,0.13), 0 -2px 8px rgba(0,0,0,0.07);
          display: flex;
          flex-direction: column;
          pointer-events: all;
          animation: slideUp 0.35s cubic-bezier(.4,0,.2,1);
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .gemini-chat-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.2rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        
        .gemini-chat-modal-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #2563eb;
          font-size: 1rem;
          font-weight: 700;
        }
        
        .gemini-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .gemini-avatar img {
          border-radius: 50%;
        }
        
        .gemini-chat-close-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }
        
        .gemini-chat-close-btn:hover {
          background: #f1f5f9;
          color: #475569;
        }
        
        .gemini-chat-messages {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          scroll-behavior: smooth;
        }
        
        .gemini-message {
          display: flex;
          flex-direction: column;
          max-width: 85%;
          margin-bottom: 1rem;
        }
        
        .gemini-message.user {
          align-self: flex-end;
        }
        
        .gemini-message.assistant {
          align-self: flex-start;
        }
        
        .gemini-message-content {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .gemini-message-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .gemini-message-avatar img {
          border-radius: 50%;
        }
        
        .gemini-message-text {
          background: #f8fafc;
          padding: 0.8rem 1rem;
          border-radius: 1.2rem;
          font-size: 0.9rem;
          line-height: 1.4;
          color: #334155;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: left;
        }
        
        .gemini-message.user .gemini-message-text {
          background: #2563eb;
          color: white;
          border-bottom-right-radius: 0.3rem;
          text-align: right;
        }
        
        .gemini-message.assistant .gemini-message-text {
          background: #f1f5f9;
          border-bottom-left-radius: 0.3rem;
          text-align: left;
        }
        
        .gemini-message-text p {
          margin: 0 0 0.5rem 0;
        }
        
        .gemini-message-text p:last-child {
          margin-bottom: 0;
        }
        
        .gemini-message-text strong {
          color: #1e293b;
          font-weight: 600;
        }
        
        .gemini-message.user .gemini-message-text strong {
          color: white;
        }
        
        .gemini-message-text em {
          color: #475569;
          font-style: italic;
        }
        
        .gemini-message.user .gemini-message-text em {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .gemini-message-text code {
          background: #e2e8f0;
          color: #1e293b;
          padding: 0.1rem 0.3rem;
          border-radius: 0.3rem;
          font-size: 0.85rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .gemini-message-text ul, .gemini-message-text ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        .gemini-message-text li {
          margin-bottom: 0.3rem;
        }
        
        .gemini-message-text blockquote {
          border-left: 3px solid #3b82f6;
          margin: 0.5rem 0;
          padding-left: 1rem;
          color: #475569;
          font-style: italic;
        }
        

        
        .gemini-message-time {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: 0.3rem;
          align-self: flex-end;
        }
        
        .gemini-typing-indicator {
          display: flex;
          gap: 0.2rem;
          align-items: center;
        }
        
        .gemini-typing-indicator span {
          width: 0.4rem;
          height: 0.4rem;
          background: #94a3b8;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .gemini-typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .gemini-typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        
        .gemini-chat-input-container {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        
        .gemini-chat-input-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          background: #f8fafc;
          border-radius: 1rem;
          padding: 0.5rem;
        }
        
        .gemini-chat-input {
          flex: 1;
          border: none;
          background: transparent;
          resize: none;
          padding: 0.5rem;
          font-size: 0.9rem;
          line-height: 1.4;
          color: #334155;
          outline: none;
          min-height: 20px;
          max-height: 100px;
        }
        
        .gemini-chat-input::placeholder {
          color: #94a3b8;
        }
        
        .gemini-chat-input-buttons {
          display: flex;
          gap: 0.3rem;
        }
        
        .gemini-voice-btn,
        .gemini-send-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .gemini-voice-btn:hover,
        .gemini-send-btn:hover {
          background: #e2e8f0;
          color: #475569;
        }
        
        .gemini-voice-btn.recording {
          background: #ef4444;
          color: white;
          animation: pulse 1s infinite;
        }
        
        .gemini-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .gemini-send-btn:not(:disabled):hover {
          background: #2563eb;
          color: white;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .quoted-phrases-section {
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          flex-shrink: 0;
        }

        .quoted-phrases-header {
          padding: 0.8rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e2e8f0;
        }

        .quoted-phrases-list {
          max-height: 200px;
          overflow-y: auto;
          padding: 0.8rem 1.5rem;
        }

        .quoted-phrase-item {
          margin-bottom: 0.8rem;
          padding: 0.6rem;
          background: white;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .quoted-phrase-item:last-child {
          margin-bottom: 0;
        }

        .quoted-phrase-translation {
          font-size: 0.8rem;
          color: #64748b;
          margin-top: 0.4rem;
          font-style: italic;
        }

        @media (max-width: 480px) {
          .gemini-chat-modal-card {
            height: 80vh;
            border-radius: 1.1rem 1.1rem 0 0;
          }
          
          .gemini-chat-modal-header,
          .gemini-chat-messages,
          .gemini-chat-input-container {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .quoted-phrases-header,
          .quoted-phrases-list {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default GeminiChatModal;
