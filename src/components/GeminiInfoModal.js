import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  X,
  LoaderCircle,
  ChevronDown,
  RefreshCw,
  Volume2,
} from "lucide-react";
import ConjugationTable from "./ConjugationTable";

const GeminiInfoModal = ({
  show,
  onClose,
  verb,
  onFetch,
  speak,
  isSpeaking,
  onOpenChat,
}) => {
  const [geminiInfo, setGeminiInfo] = useState({
    loading: false,
    data: null,
    error: null,
  });
  const [activeIndex, setActiveIndex] = useState(null);
  const activeIndexRef = useRef(null);
  const handleFetch = useCallback(
    (force = false) => {
      onFetch(verb, setGeminiInfo, force);
    },
    [verb, onFetch]
  );
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
      handleFetch(false);
      // Не сбрасываем activeIndex при открытии модального окна
      // setActiveIndex(null);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [show, handleFetch]);

  // Синхронизируем activeIndex с ref
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const handleToggle = (index) => {
    const newIndex = activeIndex === index ? null : index;
    setActiveIndex(newIndex);
    activeIndexRef.current = newIndex;
  };
  const formatVerbInfo = (info) => {
    if (!info) return null;
    const { type, regularity } = info;
    if (!type && !regularity) return null;
    let result = "";
    if (type) {
      result += type.charAt(0).toUpperCase() + type.slice(1);
    }
    if (regularity) {
      result += ` (${regularity})`;
    }
    return result + " глагол";
  };
  if (!show) return null;
  let content;
  if (geminiInfo.loading) {
    content = (
      <div className="loader-container">
        <LoaderCircle className="loader" />
        <p>Gemini генерирует информацию...</p>
      </div>
    );
  } else if (geminiInfo.error) {
    content = <div className="error-box">{geminiInfo.error}</div>;
  } else if (
    geminiInfo.data?.examples &&
    Array.isArray(geminiInfo.data.examples)
  ) {
    const stripLeadingPronoun = (text, pronoun) => {
      if (!text || !pronoun) return text?.trim() || "";
      const t = text.trim();
      const p = pronoun.toLowerCase();
      // Убираем ведущие местоимения (например, "Ich", "du", "Er/Sie/Es")
      const lowered = t.toLowerCase();
      if (lowered.startsWith(p + " ")) return t.slice(pronoun.length).trim();
      // Частые вариации er/sie/es → уберём, если совпадает любой из них
      if (p.includes("/")) {
        for (const alt of p.split("/")) {
          if (lowered.startsWith(alt + " ")) return t.slice(alt.length).trim();
        }
      }
      return t;
    };
    content = (
      <div className="gemini-data">
        <ul className="accordion-list">
          {geminiInfo.data.examples.map((ex, i) => {
            if (!ex || !ex.german_initial || !ex.russian) return null;
            const isActive = activeIndex === i;
            let cleanInitial = ex.german_initial
              .replace(/<b>/g, "")
              .replace(/<\/b>/g, "");
            // Удаляем дублирующееся местоимение, если модель его добавила в german_initial
            cleanInitial = stripLeadingPronoun(cleanInitial, ex.pronoun);
            return (
              <li key={i} className="accordion-item">
                <div
                  className="accordion-header"
                  onClick={() => handleToggle(i)}
                >
                  <div className="accordion-title">
                    <p
                      className="example-german"
                      dangerouslySetInnerHTML={{
                        __html: `<strong class="pronoun-tag">${
                          ex.pronoun
                        }</strong>&nbsp;${cleanInitial.trim()}`,
                      }}
                    />
                    <p className="example-russian">{ex.russian}</p>
                  </div>
                  <div className="accordion-controls">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Если предложение уже начинается с местоимения — не дублируем его
                        const speaks = ex.german_initial
                          .replace(/<b>/g, "")
                          .replace(/<\/b>/g, "")
                          .trim();
                        const normalized = speaks.toLowerCase();
                        const p = (ex.pronoun || "").toLowerCase();
                        const say = normalized.startsWith(p + " ")
                          ? speaks
                          : `${ex.pronoun} ${cleanInitial}`;
                        speak(say);
                      }}
                      disabled={isSpeaking}
                      className="speak-btn-small"
                    >
                      <Volume2 size={18} />
                    </button>
                    <ChevronDown
                      className={`accordion-icon ${isActive ? "active" : ""}`}
                    />
                  </div>
                </div>
                <div
                  className={`accordion-content ${isActive ? "active" : ""}`}
                >
                  {isActive && (
                    <ConjugationTable
                      forms={ex.forms}
                      speak={speak}
                      isSpeaking={isSpeaking}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  } else {
    content = (
      <div className="error-box">
        Получены некорректные данные. Попробуйте сгенерировать снова.
      </div>
    );
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="gemini-modal-header">
          <div>
            <h3 className="modal-title">
              <Sparkles className="icon-purple" />
              {verb.infinitive}
            </h3>
            {geminiInfo.data?.verb_info && (
              <p className="verb-info-subtitle">
                {formatVerbInfo(geminiInfo.data.verb_info)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X />
          </button>
        </div>
        <div className="modal-body-container">{content}</div>
        <div className="modal-footer" style={{ display: "flex", gap: 8 }}>
          <button
            className="regenerate-btn-footer"
            onClick={() => handleFetch(true)}
            disabled={geminiInfo.loading}
            style={{ flex: 1 }}
          >
            {geminiInfo.loading ? (
              <LoaderCircle className="loader-small" />
            ) : (
              <RefreshCw size={16} />
            )}
            <span>Еще варианты</span>
          </button>
          <button
            className="regenerate-btn-footer"
            onClick={() => onOpenChat && onOpenChat()}
            style={{ flex: 1, backgroundColor: "#a855f7" }}
          >
            <span>Открыть чат</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiInfoModal;
