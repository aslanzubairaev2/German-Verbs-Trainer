import React, { useState, useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { fetchLocalPhrase } from "../api/phrases";
import { generateSimilarPhrase } from "../api/gemini";
import { generateCurriculumPhrase } from "../api/gemini";
import {
  getNextTask,
  submitResult,
  registerGeneratedPhrase,
} from "../curriculum/engine";
import GeminiChatModal from "./GeminiChatModal";
import InteractivePhrase from "./InteractivePhrase";
import CardPhrase from "./CardPhrase";
import {
  Sparkles,
  Volume2,

  ChevronLeft,
  HelpCircle,
  X,
} from "lucide-react";

/**
 * Компонент для тренировки немецких фраз из локального файла
 */
function PhraseTrainer({ onBackToMain, curriculumMode = false, onNavigateToVerb }) {
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

  // Состояния для модалки немецкого слова
  const [deWordInfoCache, setDeWordInfoCache] = useState({});
  const [selectedDeWord, setSelectedDeWord] = useState(null);
  const [showDeWordInfo, setShowDeWordInfo] = useState(false);
  const [deWordInfo, setDeWordInfo] = useState(null);

  // Состояние для режима обучения
  const [curriculumTask, setCurriculumTask] = useState(null);

  // Функция для извлечения немецкого инфинитива из текста
  const extractInfinitive = (text) => {
    // Убираем лишние символы и разбиваем на слова
    const cleanText = text.replace(/[^\w\säöüÄÖÜß]/g, ' ').trim();
    
    // Паттерн для поиска немецких слов (латинские буквы + умлауты + ß)
    const germanWordPattern = /\b[a-zA-ZäöüÄÖÜß]+\b/g;
    const words = cleanText.match(germanWordPattern);
    
    if (!words) return null;
    
    // Ищем слова, которые могут быть инфинитивами
    // Инфинитивы обычно заканчиваются на -en, -ern, -eln, -n
    const infinitivePattern = /^.+(en|ern|eln)$|^(sein|haben|werden|gehen|kommen|tun)$/;
    
    // Сначала ищем точные инфинитивы
    for (const word of words) {
      if (infinitivePattern.test(word.toLowerCase()) && word.length > 2) {
        return word.toLowerCase();
      }
    }
    
    // Если не нашли точного инфинитива, ищем слова заканчивающиеся на -n (но длиннее 3 букв)
    const fallbackPattern = /^.+n$/;
    for (const word of words) {
      if (fallbackPattern.test(word) && word.length > 3) {
        return word.toLowerCase();
      }
    }
    
    // В крайнем случае возвращаем первое слово (если оно длиннее 2 букв)
    return words[0] && words[0].length > 2 ? words[0].toLowerCase() : null;
  };

  // Функция для обработки клика на инфинитив
  const handleInfinitiveClick = (infinitive) => {
    if (onNavigateToVerb && infinitive) {
      onNavigateToVerb(infinitive);
    }
  };

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
          constraints: task.constraints,
        });
        setPhrase(data);
        setError(null);
        setCurrentPhraseId(`${data.german}-${data.russian}`);
        // Регистрация для анти-повторов
        if (data?.german) registerGeneratedPhrase(data.german);
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

  // Обработка успех/повтор для режима программы
  const handleCurriculumRight = () => {
    if (!curriculumMode || !curriculumTask) return;
    submitResult(
      { taskId: Date.now(), topic: curriculumTask.topic },
      { isCorrect: true }
    );
    fetchPhrase();
  };
  const handleCurriculumWrong = () => {
    if (!curriculumMode || !curriculumTask) return;
    // «Ещё пример» — без записи результата, просто новый пример
    fetchPhrase();
  };

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
      // В режиме программы свайп не влияет на прогресс — только «Понятно» кнопкой
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

  // Обработчик клика по немецкому слову
  const handleDeWordClick = (wordData) => {
    setSelectedDeWord(wordData);
    setShowDeWordInfo(true);

    // Проверяем кеш: если справка уже есть, показываем её сразу
    if (deWordInfoCache[wordData.word]) {
      setDeWordInfo({
        loading: false,
        data: deWordInfoCache[wordData.word],
        error: null,
      });
      return;
    }
    // Если нет — делаем запрос
    fetchDeWordInfo(wordData.word);
  };

  // Получение информации о немецком слове через Gemini
  const fetchDeWordInfo = async (word) => {
    setDeWordInfo({ loading: true, data: null, error: null });

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

      // Сохраняем справку в кеш
      setDeWordInfoCache((prev) => ({ ...prev, [word]: text }));
      setDeWordInfo({ loading: false, data: text, error: null });
    } catch (error) {
      console.error("Error fetching word info:", error);
      setDeWordInfo({
        loading: false,
        data: null,
        error: "Не удалось получить информацию о слове",
      });
    }
  };

  // Извлечение немецкого слова для озвучки
  const extractGermanHeadword = (md) => {
    if (!md) return selectedDeWord?.word || "";
    // Инфинитив (нем.): lieben
    const infMatch =
      md.match(/Инфинитив\s*\(нем\.\)\s*:\s*\*\*?([A-Za-zÄÖÜäöüß]+)\*?\*/i) ||
      md.match(/Инфинитив\s*\(нем\.\)\s*:\s*([A-Za-zÄÖÜäöüß]+)/i);
    if (infMatch && infMatch[1]) return infMatch[1];
    // Форма с артиклем: der/die/das Wort
    const artMatch = md.match(
      /Форма с артиклем\s*:\s*(der|die|das)\s+([A-Za-zÄÖÜäöüß]+)/i
    );
    if (artMatch && artMatch[0]) return `${artMatch[1]} ${artMatch[2]}`;
    // Возвращаем исходное слово
    return selectedDeWord?.word || "";
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
                            const prompt = `\nТы лингвист A1-A2. Дай краткую, практичную справку о русском слове "${cleanWord}" с ориентацией на немецкий.\n\nТребования по части речи:\n- Если ЭТО СУЩЕСТВИТЕЛЬНОЕ: ОБЯЗАТЕЛЬНО укажи НОМИНАТИВ с артиклем (der/die/das) и форму множественного числа (если есть). Например: **der Apfel** (мн. **die Äpfel**).\n- Если ЭТО ГЛАГОЛ: ОБЯЗАТЕЛЬНО начни с инфинитива на немецком (напр. **lieben**), затем можно кратко упомянуть 3 л. ед. ч. (er/sie/es) в Präsens (напр. **liebt**) — но инфинитив на немецком должен быть первым.\n- Для других частей речи — просто краткая понятная справка.\n\nФормат ответа строго Markdown:\n\n## ${cleanWord}\n\n**Перевод на немецкий:** [перевод/близкие варианты]\n\n**Часть речи:** [существительное/глагол/прилагательное/наречие/и т.д.]\n\n[Если сущ.] **Форма с артиклем:** der/die/das + слово (и мн.ч., если есть)\n[Если глагол] **Инфинитив (нем.):** ...  (доп.: 3 л. ед. ч. Präsens — ...)\n\n**Примеры:**\n- [немецкая фраза] ([русский перевод])\n- [немецкая фраза] ([русский перевод])\n- [немецкая фраза] ([русский перевод])\n- [немецкая фраза] ([русский перевод])\n\n**Примечание:** [кратко, только важное]\n\nПиши кратко и дружелюбно. Не добавляй лишнего, соблюдай формат.`;
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
                  onWordClick={handleDeWordClick}
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

      {/* Кнопки контроля прогресса — только в режиме программы */}
      {curriculumMode && phrase && !loading && !generatingSimilar && (
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.5rem",
            justifyContent: "center",
          }}
        >
          <button
            onClick={handleCurriculumWrong}
            style={{
              padding: "0.5rem 0.9rem",
              borderRadius: 8,
              background: "#f1f5f9",
              color: "#334155",
            }}
          >
            Ещё пример
          </button>
          <button
            onClick={handleCurriculumRight}
            style={{
              padding: "0.5rem 0.9rem",
              borderRadius: 8,
              background: "#10b981",
              color: "#fff",
            }}
          >
            Понятно
          </button>
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
          <div
            className="word-info-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="word-info-header">
              <h3>
                Перевод слова: <strong>{selectedRuWord.word}</strong>
              </h3>
              {/* Кнопка озвучки немецкого заголовка, если извлекается */}
              {ruWordInfo?.data && (
                <button
                  onClick={() => {
                    const germanHead = extractGermanHeadword(ruWordInfo.data);
                    if (germanHead) speak(germanHead, "de-DE");
                  }}
                  className="speak-btn-small"
                  title="Озвучить слово по-немецки"
                  style={{ marginRight: "auto", marginLeft: 8 }}
                >
                  🔊
                </button>
              )}
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
                  <ReactMarkdown
                    components={{
                      strong: ({ children, ...props }) => {
                        const text = children?.toString() || "";
                        
                        // Проверяем, является ли это инфинитивом более точно
                        const fullMarkdown = ruWordInfo?.data || '';
                        
                        // Ищем инфинитив в строке типа "**Инфинитив (нем.):** denken"
                        const infinitiveMatch = fullMarkdown.match(/\*\*Инфинитив\s*\(нем\.\)\s*:\*\*\s*([a-zA-ZäöüÄÖÜß]+)/i);
                        const foundInfinitive = infinitiveMatch ? infinitiveMatch[1] : null;
                        
                        // Проверяем, является ли текущий text именно найденным инфинитивом
                        const isActualInfinitive = foundInfinitive && text.toLowerCase() === foundInfinitive.toLowerCase();
                        
                        
                        // Также проверяем, является ли само слово потенциальным инфинитивом (для логов)
                        const isPotentialInfinitiveForLog = extractInfinitive(text) === text.toLowerCase();
                        
                        // Отладочная информация
                        if (text && text.length > 2) {
                          console.log('PhraseTrainer Debug - RU Modal:', {
                            text,
                            foundInfinitive,
                            isActualInfinitive,
                            isPotentialInfinitive: isPotentialInfinitiveForLog,
                            extractedInfinitive: extractInfinitive(text),
                            fullMarkdownSnippet: fullMarkdown.substring(fullMarkdown.indexOf('Инфинитив') - 20, fullMarkdown.indexOf('Инфинитив') + 100)
                          });
                        }
                        
                        // Проверяем, является ли слово инфинитивом
                        // 1. Ищем инфинитив после "Инфинитив (нем.):"
                        const afterInfinitivePattern = /Инфинитив\s*\(нем\.\)\s*:\s*([a-zA-ZäöüÄÖÜß]+)/i;
                        const afterMatch = fullMarkdown.match(afterInfinitivePattern);
                        const infinitiveAfterColon = afterMatch ? afterMatch[1] : null;
                        
                        // 2. Проверяем, является ли это потенциальным инфинитивом
                        const isPotentialInfinitive = extractInfinitive(text) === text.toLowerCase();
                        
                        // 3. Определяем, должно ли слово быть кликабельным
                        const shouldBeClickable = 
                          (infinitiveAfterColon && text.toLowerCase() === infinitiveAfterColon.toLowerCase()) ||
                          isPotentialInfinitive;
                        
                        if (onNavigateToVerb && shouldBeClickable) {
                          const infinitive = extractInfinitive(text);
                          if (infinitive) {
                            return (
                              <strong 
                                {...props}
                                style={{
                                  color: '#2563eb',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  borderRadius: '3px',
                                  padding: '2px 4px',
                                  background: 'rgba(37, 99, 235, 0.1)',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleInfinitiveClick(infinitive)}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(37, 99, 235, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(37, 99, 235, 0.1)';
                                }}
                                title={`🎯 Перейти к отработке глагола "${infinitive}"`}
                              >
                                {children}
                              </strong>
                            );
                          }
                        }
                        
                        return <strong {...props}>{children}</strong>;
                      },
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
                    {ruWordInfo.data}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно информации о немецком слове */}
      {showDeWordInfo && selectedDeWord && (
        <div className="word-info-modal">
          <div
            className="word-info-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="word-info-header">
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <h3>
                  Справка о слове: <strong>{selectedDeWord.word}</strong>
                </h3>
                <button
                  onClick={() =>
                    speak &&
                    speak(extractGermanHeadword(deWordInfo?.data), "de-DE")
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
                  }}
                  title="Озвучить слово"
                >
                  <Volume2 size={18} />
                </button>
              </div>
              <button
                onClick={() => setShowDeWordInfo(false)}
                className="close-btn"
              >
                <X size={16} />
              </button>
            </div>
            <div className="word-info-body">
              {deWordInfo?.loading && (
                <div className="word-info-loading">
                  <div className="loading-spinner"></div>
                  <span>Загружаем информацию...</span>
                </div>
              )}

              {deWordInfo?.error && (
                <div className="word-info-error">{deWordInfo.error}</div>
              )}

              {deWordInfo?.data && (
                <div className="word-info-markdown">
                  <ReactMarkdown
                    components={{
                      strong: ({ children, ...props }) => {
                        const text = children?.toString() || "";
                        
                        // Проверяем, является ли это инфинитивом более точно
                        const fullMarkdown = deWordInfo?.data || '';
                        
                        // Ищем инфинитив в строке типа "**Инфинитив (нем.):** denken"
                        const infinitiveMatch = fullMarkdown.match(/\*\*Инфинитив\s*\(нем\.\)\s*:\*\*\s*([a-zA-ZäöüÄÖÜß]+)/i);
                        const foundInfinitive = infinitiveMatch ? infinitiveMatch[1] : null;
                        
                        // Проверяем, является ли текущий text именно найденным инфинитивом
                        const isActualInfinitive = foundInfinitive && text.toLowerCase() === foundInfinitive.toLowerCase();
                        
                        
                        // Также проверяем, является ли само слово потенциальным инфинитивом (для логов)
                        const isPotentialInfinitiveForLog2 = extractInfinitive(text) === text.toLowerCase();
                        
                        // Отладочная информация
                        if (text && text.length > 2) {
                          console.log('PhraseTrainer Debug - DE Modal:', {
                            text,
                            foundInfinitive,
                            isActualInfinitive,
                            isPotentialInfinitive: isPotentialInfinitiveForLog2,
                            extractedInfinitive: extractInfinitive(text)
                          });
                        }
                        
                        // Проверяем, является ли слово инфинитивом
                        // 1. Ищем инфинитив после "Инфинитив (нем.):"
                        const afterInfinitivePattern = /Инфинитив\s*\(нем\.\)\s*:\s*([a-zA-ZäöüÄÖÜß]+)/i;
                        const afterMatch = fullMarkdown.match(afterInfinitivePattern);
                        const infinitiveAfterColon = afterMatch ? afterMatch[1] : null;
                        
                        // 2. Проверяем, является ли это потенциальным инфинитивом
                        const isPotentialInfinitive = extractInfinitive(text) === text.toLowerCase();
                        
                        // 3. Определяем, должно ли слово быть кликабельным
                        const shouldBeClickable = 
                          (infinitiveAfterColon && text.toLowerCase() === infinitiveAfterColon.toLowerCase()) ||
                          isPotentialInfinitive;
                        
                        if (onNavigateToVerb && shouldBeClickable) {
                          const infinitive = extractInfinitive(text);
                          if (infinitive) {
                            return (
                              <strong 
                                {...props}
                                style={{
                                  color: '#2563eb',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  borderRadius: '3px',
                                  padding: '2px 4px',
                                  background: 'rgba(37, 99, 235, 0.1)',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleInfinitiveClick(infinitive)}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(37, 99, 235, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(37, 99, 235, 0.1)';
                                }}
                                title={`🎯 Перейти к отработке глагола "${infinitive}"`}
                              >
                                {children}
                              </strong>
                            );
                          }
                        }
                        
                        return <strong {...props}>{children}</strong>;
                      },
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
                    {deWordInfo.data}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
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

        /* Стили для модалки немецкого слова */
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
          max-width: 640px;
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

export default PhraseTrainer;
