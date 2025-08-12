import React, { useState, useMemo, useRef, useEffect } from "react";
import { X, Search, Check, Mic, MicOff, Plus } from "lucide-react";
import { generateFullVerbByPrompt } from "../api/gemini";
import { addUserVerb, loadUserVerbs } from "../storage/userVerbs";

const LEVEL_ORDER = ["A1", "A2", "B1", "B2"];

// Нормализация строки для сравнения (нижний регистр)
function normalize(str) {
  return (str || "").toString().trim().toLowerCase();
}

// Простой Левенштейн для приблизительного совпадения
function levenshtein(a, b) {
  a = normalize(a);
  b = normalize(b);
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function pickBestMatch(query, verbs) {
  const q = normalize(query);
  if (!q) return null;
  let best = null;
  let bestScore = Infinity;
  for (const verb of verbs) {
    const candidates = [verb.infinitive, verb.russian];
    for (const cand of candidates) {
      const score = levenshtein(q, cand);
      if (score < bestScore) {
        bestScore = score;
        best = verb;
      }
      // Быстрый выход, если точное совпадение
      if (score === 0) return verb;
    }
  }
  // Порог для «достаточно близко»: длина строки <= 5 → 1, иначе 2
  const threshold = q.length <= 5 ? 1 : 2;
  return bestScore <= threshold ? best : null;
}

const VerbListModal = ({
  show,
  onClose,
  onSelectVerb,
  verbs,
  masteredVerbs,
  onAddedVerb,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Сбрасываем строку поиска и ставим фокус на инпут при открытии модалки (web)
  const inputRef = useRef(null);
  useEffect(() => {
    if (show) {
      setSearchTerm("");
      try {
        inputRef.current?.focus?.();
      } catch {}
    }
  }, [show]);

  const filteredVerbs = useMemo(() => {
    if (!searchTerm) return verbs;
    const lowercasedFilter = normalize(searchTerm);
    return verbs.filter(
      (verb) =>
        normalize(verb.infinitive).includes(lowercasedFilter) ||
        normalize(verb.russian).includes(lowercasedFilter)
    );
  }, [searchTerm, verbs]);

  const groupedVerbs = useMemo(() => {
    return filteredVerbs.reduce((acc, verb) => {
      (acc[verb.level] = acc[verb.level] || []).push(verb);
      return acc;
    }, {});
  }, [filteredVerbs]);

  const noResults = Object.keys(groupedVerbs).length === 0;

  async function handleAddByAI() {
    if (!searchTerm.trim() || adding) return;
    setAdding(true);
    setAddError("");
    try {
      const data = await generateFullVerbByPrompt({ query: searchTerm.trim() });
      // простая валидация
      if (
        !data?.infinitive ||
        !Array.isArray(data?.forms) ||
        data.forms.length !== 6
      ) {
        throw new Error("Некорректные данные от модели");
      }
      addUserVerb({
        infinitive: data.infinitive,
        russian: data.russian || "",
        level: data.level || "A1",
        type: data.type || "regular",
        forms: data.forms,
        _user: true,
      });
      // обновляем поиск новым инфинитивом
      setSearchTerm(data.infinitive);
      if (typeof onAddedVerb === "function") onAddedVerb();
    } catch (e) {
      setAddError(
        "Не удалось добавить. Попробуйте иначе сформулировать запрос."
      );
    } finally {
      setAdding(false);
    }
  }

  function stopRecognition() {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setListening(false);
  }

  // Сложное место: авто-определение языка RU→DE двумя попытками
  async function handleVoiceSearch() {
    if (listening) {
      stopRecognition();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Распознавание речи не поддерживается в этом браузере.");
      return;
    }
    setListening(true);

    const tryLang = (lang) =>
      new Promise((resolve) => {
        const rec = new SR();
        recognitionRef.current = rec;
        rec.lang = lang;
        rec.interimResults = false;
        rec.maxAlternatives = 3;
        let resolved = false;
        rec.onresult = (e) => {
          const transcript = Array.from(e.results)
            .map((r) => r[0]?.transcript || "")
            .join(" ")
            .trim();
          if (!resolved) {
            resolved = true;
            resolve(transcript);
          }
        };
        rec.onerror = () => resolve("");
        rec.onend = () => !resolved && resolve("");
        rec.start();
      });

    // 1) Пытаемся распознать на русском
    let said = await tryLang("ru-RU");
    if (!said) {
      // 2) Пытаемся распознать на немецком
      said = await tryLang("de-DE");
    }

    stopRecognition();

    if (!said) return;
    setSearchTerm(said);
    const best = pickBestMatch(said, verbs);
    if (best) {
      onSelectVerb(best);
    }
  }

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="verb-list-modal"
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: "0.75rem",
          maxWidth: "640px",
          width: "95vw",
          maxHeight: "83dvh",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="modal-close-btn"
          style={{ right: "0.6rem" }}
        >
          <X />
        </button>
        <div className="verb-list-header">
          <h3 className="modal-title">Список глаголов</h3>
          {/* Ряд поиска */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Обёртка для инпута с иконками */}
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              {/* Очистка */}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  title="Очистить"
                  aria-label="Очистить"
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                  }}
                >
                  <X size={16} />
                </button>
              )}
              <input
                type="text"
                placeholder="Поиск на немецком или русском..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && noResults && searchTerm.trim()) {
                    handleAddByAI();
                  } else if (e.key === "Enter" && !noResults) {
                    // если есть единственный результат — выбрать его
                    const levels = Object.keys(groupedVerbs);
                    let onlyVerb = null;
                    let count = 0;
                    for (const lvl of levels) {
                      const arr = groupedVerbs[lvl] || [];
                      count += arr.length;
                      if (arr.length === 1 && !onlyVerb) onlyVerb = arr[0];
                    }
                    if (count === 1 && onlyVerb) onSelectVerb(onlyVerb);
                  }
                }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: "1rem",
                  padding: "0.5rem 2rem 0.5rem 2rem",
                }}
                ref={inputRef}
              />
            </div>
            {/* Микрофон */}
            <button
              type="button"
              onClick={handleVoiceSearch}
              title={listening ? "Остановить распознавание" : "Голосовой поиск"}
              aria-label="Голосовой поиск"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: "1px solid #e2e8f0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: listening ? "#fee2e2" : "#f8fafc",
                color: listening ? "#b91c1c" : "#334155",
              }}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>
        </div>
        <div className="modal-body-container">
          {noResults ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <p className="no-results" style={{ marginBottom: 12 }}>
                Глагол не найден.
              </p>
              <button
                onClick={handleAddByAI}
                disabled={adding || !searchTerm.trim()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0.6rem 1rem",
                  borderRadius: 8,
                  background: adding ? "#93c5fd" : "#2563eb",
                  color: "#fff",
                }}
                title="Добавить глагол через ИИ"
              >
                {adding ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      className="loader-small"
                      style={{
                        border: "2px solid transparent",
                        borderTop: "2px solid #fff",
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        display: "inline-block",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Добавляем…
                  </span>
                ) : (
                  <>
                    <Plus size={16} /> Добавить «{searchTerm || "..."}»
                  </>
                )}
              </button>
              {addError && (
                <div style={{ color: "#b91c1c", marginTop: 8 }}>{addError}</div>
              )}
            </div>
          ) : (
            LEVEL_ORDER.map(
              (level) =>
                groupedVerbs[level] && (
                  <div key={level}>
                    <h4 className="level-header">{level}</h4>
                    <ul className="verb-list">
                      {groupedVerbs[level].map((verb) => (
                        <li
                          key={verb.infinitive}
                          onClick={() => onSelectVerb(verb)}
                        >
                          <span>
                            {verb.infinitive}{" "}
                            <span className="verb-translation">
                              ({verb.russian})
                            </span>
                          </span>
                          {masteredVerbs.includes(verb.infinitive) && (
                            <Check className="check-mark" size={18} />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default VerbListModal;
