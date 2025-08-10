import React, { useState, useEffect, useMemo } from "react";
import { PHRASES } from "../phrases";

// --- Группы и словари ---
const GROUPS = [
  { key: "Глаголы", en: "Verbs" },
  { key: "Местоимения", en: "Pronouns" },
  { key: "Аккузативы", en: "Accusatives" },
  { key: "Вопросительные слова", en: "Question words" },
  { key: "Слова времени", en: "Time words" },
];

const WORD_TRANSLATIONS = {
  // Местоимения
  ich: "я",
  du: "ты",
  er: "он",
  sie: "она/они",
  es: "оно",
  wir: "мы",
  ihr: "вы (мн.ч.)",
  Sie: "Вы (вежл.)",
  mich: "меня",
  dich: "тебя",
  ihn: "его",
  uns: "нас",
  euch: "вас",
  ihnen: "им",
  mir: "мне",
  dir: "тебе",
  ihm: "ему",
  Ihnen: "Вам (вежл.)",
  // Аккузативы
  den: "(опред. артикль, м.р., аккуз.)",
  die: "(опред. артикль, ж.р./мн.ч.)",
  das: "(опред. артикль, ср.р.)",
  einen: "(неопр. артикль, м.р., аккуз.)",
  eine: "(неопр. артикль, ж.р.)",
  ein: "(неопр. артикль, ср.р.)",
  meinen: "мой (м.р., аккуз.)",
  deinen: "твой (м.р., аккуз.)",
  seinen: "его (м.р., аккуз.)",
  ihren: "её/их (м.р., аккуз.)",
  unseren: "наш (м.р., аккуз.)",
  euren: "ваш (м.р., аккуз.)",
  Ihren: "Ваш (м.р., аккуз.)",
  jemanden: "кого-то",
  etwas: "что-то",
  // Глаголы (инфинитивы)
  sein: "быть",
  haben: "иметь",
  werden: "становиться",
  können: "мочь",
  müssen: "должен",
  wollen: "хотеть",
  sollen: "следует",
  dürfen: "разрешено",
  mögen: "нравиться",
  machen: "делать",
  gehen: "идти",
  kommen: "приходить",
  geben: "давать",
  nehmen: "брать",
  sprechen: "говорить",
  fragen: "спрашивать",
  antworten: "отвечать",
  sehen: "видеть",
  hören: "слышать",
  spielen: "играть",
  arbeiten: "работать",
  wohnen: "жить",
  trinken: "пить",
  essen: "есть",
  lernen: "учить",
  helfen: "помогать",
  denken: "думать",
  kaufen: "покупать",
  verkaufen: "продавать",
  lieben: "любить",
  finden: "находить",
  brauchen: "нуждаться",
  bleiben: "оставаться",
  bringen: "приносить",
  fahren: "ехать",
  lesen: "читать",
  schreiben: "писать",
  stehen: "стоять",
  sagen: "сказать",
  zeigen: "показывать",
  beginnen: "начинать",
  enden: "заканчивать",
  vergessen: "забывать",
  verstehen: "понимать",
  bekommen: "получать",
  laufen: "бежать",
  schlafen: "спать",
  tragen: "носить",
  treffen: "встречать",
  verlieren: "терять",
  gewinnen: "выигрывать",
  // Вопросительные слова
  wer: "кто",
  was: "что",
  wo: "где",
  wann: "когда",
  warum: "почему",
  wie: "как",
  wohin: "куда",
  woher: "откуда",
  wessen: "чей",
  wem: "кому",
  wen: "кого",
  welcher: "который",
  welche: "которая",
  welches: "которое",
  wieviel: "сколько",
  wieso: "почему",
  weshalb: "зачем",
  wodurch: "через что",
  womit: "чем",
  woran: "на чём",
  woraus: "из чего",
  worüber: "о чём",
  wovon: "о чём",
  wovor: "перед чем",
  worum: "о чём",
  wobei: "при чём",
  wogegen: "против чего",
  // Слова времени
  morgen: "завтра",
  heute: "сегодня",
  später: "потом",
  gestern: "вчера",
  jetzt: "сейчас",
  bald: "скоро",
  früh: "рано",
  abends: "вечером",
  mittags: "днём",
  nachts: "ночью",
  sofort: "сразу",
  gleich: "сейчас же",
  übermorgen: "послезавтра",
  vorgestern: "позавчера",
  immer: "всегда",
  nie: "никогда",
  manchmal: "иногда",
  oft: "часто",
  selten: "редко",
};

const LS_KEY = "phraseTrainerSettings";

// --- Автоматический сбор слов по группам ---
function collectGroupedWords(phrases) {
  const grouped = {};
  GROUPS.forEach(({ key }) => {
    grouped[key] = new Set();
  });

  phrases.forEach((phrase) => {
    const germanWords = phrase.german
      .split(/\s+/)
      .map((w) => w.replace(/[.,!?;:]/g, ""));
    germanWords.forEach((word) => {
      const lowerWord = word.toLowerCase();
      GROUPS.forEach(({ key }) => {
        if (WORD_TRANSLATIONS[lowerWord]) {
          grouped[key].add(word);
        }
      });
    });
  });

  // Преобразуем Set в массивы
  Object.keys(grouped).forEach((key) => {
    grouped[key] = Array.from(grouped[key]);
  });
  return grouped;
}

// --- Сбор всех форм глаголов ---
function getVerbFormsMap(phrases, verbs) {
  const map = {};
  verbs.forEach((inf) => (map[inf] = new Set()));

  phrases.forEach((phrase) => {
    const germanWords = phrase.german
      .split(/\s+/)
      .map((w) => w.replace(/[.,!?;:]/g, ""));
    germanWords.forEach((word) => {
      const lowerWord = word.toLowerCase();
      verbs.forEach((inf) => {
        if (lowerWord === inf || lowerWord.startsWith(inf.slice(0, 3))) {
          map[inf].add(word);
        }
      });
    });
  });

  Object.keys(map).forEach((inf) => {
    map[inf] = Array.from(map[inf]);
  });
  return map;
}

export { getVerbFormsMap };

export default function PhraseSettingsModal({ open, onClose, onSave }) {
  // --- Сбор данных ---
  const groupedWords = useMemo(() => collectGroupedWords(PHRASES), []);
  const verbFormsMap = useMemo(
    () => getVerbFormsMap(PHRASES, groupedWords["Глаголы"] || []),
    [groupedWords]
  );

  // --- Состояния ---
  const [selectedWords, setSelectedWords] = useState({});
  const [verbSearch, setVerbSearch] = useState("");
  const [warning, setWarning] = useState("");

  // --- Загрузка из localStorage при открытии ---
  useEffect(() => {
    if (!open) return;
    let initial = {};
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY));
      if (saved && saved.words) initial = saved.words;
    } catch {}
    // Для каждой группы — массив (даже если пустой)
    GROUPS.forEach(({ key }) => {
      if (!initial[key]) initial[key] = [];
    });
    setSelectedWords(initial);
    setWarning("");
  }, [open]);

  // --- Проверка: выбрано ли что-то ---
  useEffect(() => {
    const anySelected = GROUPS.some(
      ({ key }) => (selectedWords[key] || []).length > 0
    );
    setWarning(anySelected ? "" : "Выберите хотя бы одно слово");
  }, [selectedWords]);

  // --- Обработчики ---
  function toggleWord(group, word) {
    setSelectedWords((prev) => {
      const arr = prev[group] || [];
      return {
        ...prev,
        [group]: arr.includes(word)
          ? arr.filter((w) => w !== word)
          : [...arr, word],
      };
    });
  }
  function selectAll(group) {
    setSelectedWords((prev) => ({
      ...prev,
      [group]: [...(groupedWords[group] || [])],
    }));
  }
  function deselectAll(group) {
    setSelectedWords((prev) => ({ ...prev, [group]: [] }));
  }
  function handleSave() {
    if (warning) return;
    const settings = { words: selectedWords };
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
    if (onSave) onSave(settings);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="phrase-settings-modal-overlay">
      <div className="phrase-settings-modal">
        <div className="phrase-settings-header">
          <h2>Настройки фильтрации фраз</h2>
          <button className="close-btn" onClick={onClose} title="Закрыть">
            ×
          </button>
        </div>
        <div className="phrase-settings-body">
          {GROUPS.map(({ key, en }) => (
            <div className="settings-section" key={key}>
              <div className="settings-section-title">
                {key}{" "}
                <span
                  style={{
                    color: "#64748b",
                    fontWeight: 400,
                    fontSize: "0.98em",
                    marginLeft: 8,
                  }}
                >
                  ({en})
                </span>
              </div>
              {key === "Глаголы" && (
                <input
                  type="text"
                  placeholder="Поиск глагола..."
                  value={verbSearch}
                  onChange={(e) => setVerbSearch(e.target.value)}
                  style={{
                    width: "100%",
                    marginBottom: "0.7rem",
                    padding: "0.4rem 0.7rem",
                    borderRadius: "0.3rem",
                    border: "1px solid #e2e8f0",
                    fontSize: "1rem",
                  }}
                />
              )}
              <div className="settings-actions">
                <button onClick={() => selectAll(key)}>Все</button>
                <button onClick={() => deselectAll(key)}>Снять</button>
              </div>
              <div className="settings-checkbox-list vertical-list">
                {(groupedWords[key] || [])
                  .filter((word) => {
                    if (key !== "Глаголы" || !verbSearch.trim()) return true;
                    const search = verbSearch.trim().toLowerCase();
                    const wordMatch = word.toLowerCase().includes(search);
                    const ruMatch = (
                      WORD_TRANSLATIONS[word.toLowerCase()] || ""
                    )
                      .toLowerCase()
                      .includes(search);
                    return wordMatch || ruMatch;
                  })
                  .map((word) => (
                    <label key={word} className="settings-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedWords[key]?.includes(word) || false}
                        onChange={() => toggleWord(key, word)}
                      />
                      {word}
                      {WORD_TRANSLATIONS[word.toLowerCase()] && (
                        <span
                          style={{
                            color: "#64748b",
                            fontWeight: 400,
                            fontSize: "0.98em",
                            marginLeft: 6,
                          }}
                        >
                          — {WORD_TRANSLATIONS[word.toLowerCase()]}
                        </span>
                      )}
                    </label>
                  ))}
              </div>
            </div>
          ))}
          {warning && <div className="settings-warning">{warning}</div>}
        </div>
        <div className="phrase-settings-footer">
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!!warning}
          >
            Сохранить
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
      {/* --- Минималистичные стили, sticky header/footer, скролл --- */}
      <style>{`
        .phrase-settings-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 3000;
        }
        .phrase-settings-modal {
          background: #fff; border-radius: 1rem; box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          width: 95vw; max-width: 420px; min-height: 320px; max-height: 90vh; padding: 0; display: flex; flex-direction: column;
        }
        .phrase-settings-header { position: sticky; top: 0; background: #fff; z-index: 2; display: flex; align-items: center; justify-content: space-between; padding: 1.2rem 1.5rem 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
        .phrase-settings-header h2 { margin: 0; font-size: 1.25rem; font-weight: 600; color: #1e293b; }
        .close-btn { background: none; border: none; color: #64748b; font-size: 1.5rem; cursor: pointer; border-radius: 0.3rem; padding: 0.2rem 0.6rem; transition: background 0.2s; }
        .close-btn:hover { background: #f1f5f9; color: #475569; }
        .phrase-settings-body { flex: 1 1 auto; min-height: 0; padding: 2rem 1.5rem 1.5rem 1.5rem; overflow-y: auto; }
        .settings-section { margin-bottom: 1.5rem; }
        .settings-section-title { font-size: 1.05rem; font-weight: 500; color: #334155; margin-bottom: 0.5rem; }
        .settings-actions { margin-bottom: 0.5rem; }
        .settings-actions button { background: none; border: none; color: #2563eb; font-size: 0.95rem; margin-right: 0.7rem; cursor: pointer; padding: 0.1rem 0.3rem; border-radius: 0.2rem; transition: background 0.2s; }
        .settings-actions button:hover { background: #f1f5f9; }
        .settings-checkbox-list { display: flex; flex-direction: column; gap: 0.2rem; }
        .settings-checkbox { font-size: 0.98rem; color: #475569; display: flex; align-items: center; gap: 0.4rem; }
        .settings-warning { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 0.7rem 1rem; margin-top: 1.2rem; text-align: center; }
        .phrase-settings-footer { position: sticky; bottom: 0; background: #fff; z-index: 2; display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 1.5rem 1.2rem 1.5rem; border-top: 1px solid #e2e8f0; flex-shrink: 0; }
        .save-btn { background: #2563eb; color: #fff; border: none; border-radius: 0.4rem; padding: 0.5rem 1.2rem; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background 0.2s; }
        .save-btn:disabled { background: #cbd5e1; color: #64748b; cursor: not-allowed; }
        .save-btn:not(:disabled):hover { background: #1d4ed8; }
        .cancel-btn { background: none; color: #64748b; border: none; border-radius: 0.4rem; padding: 0.5rem 1.2rem; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background 0.2s; }
        .cancel-btn:hover { background: #f1f5f9; }
      `}</style>
    </div>
  );
}
