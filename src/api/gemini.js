import {
  PHRASE_VOCAB,
  getRandomTemplate,
  randomFrom,
} from "../constants/phraseVocabulary.js";
import {
  safeParseJSON,
  validatePhraseJson,
  validateVerbInfoJson,
} from "../utils/geminiParsing";

// Единый клиент Gemini: GemeniGen (REST)
const MODEL_NAME = "gemini-1.5-flash-latest";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function getApiKey() {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API ключ не настроен в .env");
  return apiKey;
}

async function requestModel({
  prompt,
  generationConfig = {},
  model = MODEL_NAME,
}) {
  const apiKey = getApiKey();
  const url = `${API_BASE}/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
  };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    try {
      const errJson = await response.json();
      console.warn("Gemini API error payload:", errJson);
    } catch {}
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  const result = await response.json();
  const parts = result?.candidates?.[0]?.content?.parts;
  const textPart = Array.isArray(parts)
    ? parts.find((p) => typeof p?.text === "string")
    : undefined;
  const raw = textPart?.text?.trim();
  return { result, raw };
}

function stripCodeFence(raw) {
  if (!raw || !raw.startsWith("```")) return raw;
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

async function callModelJSON(prompt, options = {}) {
  const gen = { responseMimeType: "application/json", ...options };
  const { raw } = await requestModel({ prompt, generationConfig: gen });
  try {
    return safeParseJSON(raw);
  } catch (e) {
    console.warn("Gemini JSON parse failed", e);
    throw new Error("Не удалось распарсить JSON от Gemini");
  }
}

async function callModelText(prompt, options = {}) {
  const gen = {
    responseMimeType: "text/plain",
    maxOutputTokens: options.maxOutputTokens ?? 1024,
    ...options,
  };
  let { raw, result } = await requestModel({ prompt, generationConfig: gen });
  if (raw && raw.length > 0) return raw;
  let parts = result?.candidates?.[0]?.content?.parts || [];
  let allText = parts
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
  if (allText) return allText;
  const retryPrompt = `${prompt}\n\nОтветь максимально кратко (1-2 предложения) простым языком.`;
  const genRetry = {
    responseMimeType: "text/plain",
    maxOutputTokens: Math.min(768, gen.maxOutputTokens ?? 768),
    temperature: Math.min(0.4, gen.temperature ?? 0.4),
  };
  ({ raw, result } = await requestModel({
    prompt: retryPrompt,
    generationConfig: genRetry,
  }));
  if (raw && raw.length > 0) return raw;
  parts = result?.candidates?.[0]?.content?.parts || [];
  allText = parts
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
  if (allText) return allText;
  return "Извините, не удалось получить ответ. Попробуйте ещё раз.";
}

export const GemeniGen = {
  model: MODEL_NAME,
  callJSON: callModelJSON,
  callText: callModelText,
};

// API-функции для работы с Gemini (Google AI)

/**
 * Получить подробную информацию о глаголе через Gemini
 */
export async function fetchGeminiInfo({
  verb,
  geminiDataCache,
  setGeminiDataCache,
  setter,
  force = false,
}) {
  if (!verb || !verb.infinitive) {
    setter({ loading: false, data: null, error: "Глагол не определён" });
    return;
  }
  if (geminiDataCache[verb.infinitive] && !force) {
    setter({
      loading: false,
      data: geminiDataCache[verb.infinitive],
      error: null,
    });
    return;
  }
  setter({ loading: true, data: null, error: null });
  try {
    const prompt = `
      Для немецкого глагола '${verb.infinitive}' (${verb.russian}), создай JSON объект.
      Объект должен содержать ключи: "verb_info" и "examples".
      1) verb_info: { "type": (слабый/сильный/смешанный/модальный/правильный/неправильный), "regularity": (правильный/неправильный) }
      2) examples: массив из 6 элементов для местоимений ich, du, er/sie/es, wir, ihr, sie/Sie.
         Каждый элемент: { "pronoun": "ich", "german_initial": "предложение БЕЗ местоимения с <b></b> вокруг форм глагола", "russian": "перевод", "forms": { "present": {...}, "past": {...}, "future": {...} } }
      Формы: present/past(Perfekt)/future(Futur I) с полями question/affirmative/negative. Глагольные части в <b>...</b>.
      Дай только валидный JSON без комментариев.
    `;
    const data = await callModelJSON(prompt);
    validateVerbInfoJson(data);
    setGeminiDataCache((prev) => ({ ...prev, [verb.infinitive]: data }));
    setter({ loading: false, data, error: null });
  } catch (error) {
    console.error("Fetch Gemini Info Error:", error);
    setter({
      loading: false,
      data: null,
      error: error.message || "Не удалось получить данные от Gemini.",
    });
  }
}

/**
 * Получить формы глагола для определённого местоимения через Gemini
 */
export async function fetchVerbForms({
  verb,
  pronoun,
  verbFormsCache,
  setVerbFormsCache,
  setter,
}) {
  if (!verb || !verb.infinitive || !pronoun || !pronoun.base) {
    setter({
      loading: false,
      data: null,
      error: "Глагол или местоимение не определены",
    });
    return;
  }
  const pronounKey = pronoun.base;
  const pronounDisplay = pronoun.german;
  if (verbFormsCache[verb.infinitive]?.[pronounKey]) {
    setter({
      loading: false,
      data: verbFormsCache[verb.infinitive][pronounKey],
      error: null,
    });
    return;
  }
  setter({ loading: true, data: null, error: null });
  try {
    const prompt = `
      Для глагола "${verb.infinitive}" и местоимения "${pronounDisplay}" создай JSON:
      { "forms": { "present": {"question":"...","affirmative":"...","negative":"..."}, "past": {...}, "future": {...} } }
      past = Perfekt, future = Futur I. Глагольные части выделяй <b></b>. Используй местоимение в тексте.
      Дай только валидный JSON.
    `;
    const data = await callModelJSON(prompt);
    setVerbFormsCache((prev) => ({
      ...prev,
      [verb.infinitive]: { ...prev[verb.infinitive], [pronounKey]: data },
    }));
    setter({ loading: false, data, error: null });
  } catch (error) {
    console.error("Fetch Verb Forms Error:", error);
    setter({
      loading: false,
      data: null,
      error: "Не удалось загрузить формы.",
    });
  }
}

/**
 * Получить объяснение ошибки для практики через Gemini (текст)
 */
export async function fetchExplanation({ prompt, setter }) {
  if (!prompt) {
    setter("");
    return;
  }
  setter("Загружаю объяснение...");
  try {
    const text = await callModelText(prompt, {
      temperature: 0.3,
      maxOutputTokens: 200,
    });
    setter(text);
  } catch (error) {
    console.error("Fetch Explanation Error:", error);
    setter("Не удалось получить объяснение");
  }
}

/**
 * Получить контекстные примеры с подсветкой глаголов для практики (текст)
 */
export async function fetchContextExamples({
  verb,
  pronoun,
  correctForm,
  wrongForm,
  setter,
}) {
  if (!verb || !pronoun || !correctForm) {
    setter("");
    return;
  }
  // быстрый базовый пример до ответа модели
  setter(`<b>${correctForm}</b> - правильная форма для "${pronoun}"`);
  try {
    const prompt = `Создай 3 очень простых примера предложений на немецком с глаголом "${verb.infinitive}" и местоимением "${pronoun}" в форме "${correctForm}".
В каждом предложении выдели глагол тегами <b></b>. Дай только нумерованный список 1-3.`;
    const examples = await callModelText(prompt, {
      temperature: 0.3,
      maxOutputTokens: 150,
    });
    setter(examples.trim());
  } catch (error) {
    console.error("Fetch Context Examples Error:", error);
    setter(`<b>${correctForm}</b> - правильная форма для "${pronoun}"`);
  }
}

// --- Генерация простой фразы для тренировки ---
export async function fetchGeminiPhrase({ setter }) {
  setter({ loading: true, data: null, error: null });
  try {
    // 1. Получаем случайный шаблон
    const template = getRandomTemplate();
    // 2. Собираем слова по шаблону
    const selectedWords = template.pattern.map((wordType) => {
      const wordArray = PHRASE_VOCAB[wordType];
      if (!wordArray) return "ich";
      return randomFrom(wordArray);
    });
    const wordsList = selectedWords.join(" ");

    const prompt = `Ты лингвист-методист. Создай ОЧЕНЬ ПРОСТУЮ фразу уровня A1 (урок Петрова): Кто + Глагол + (Что/Где/Когда). Коротко (2-4 слова), естественно.
Слова-опоры: ${wordsList}
Правила: настоящее время, без сложных конструкций, модальный глагол — только с основным. Отрицания: nicht/kein корректно.
Дай JSON строго вида { "german": "...", "russian": "..." } без лишнего текста.`;

    const data = await callModelJSON(prompt);
    const valid = validatePhraseJson(data);
    setter({ loading: false, data: valid, error: null });
  } catch (error) {
    console.error("Fetch Gemini Phrase Error:", error);
    setter({
      loading: false,
      data: null,
      error: error.message || "Не удалось получить фразу от Gemini.",
    });
  }
}

// --- Дополнительно: генерация похожей фразы (оставлено как задел) ---
export async function fetchSimilarPhrase({ basePhrase, setter }) {
  try {
    if (setter) setter({ loading: true, data: null, error: null });
    const baseGerman = basePhrase?.german || "";
    const baseRussian = basePhrase?.russian || "";
    const prompt = `Создай ОДНУ очень простую ЕСТЕСТВЕННУЮ фразу уровня A1, похожую по смыслу и структуре на: "${baseGerman}" (${baseRussian}).
Измени минимум 2 аспекта из списка: местоимение, глагол (соответствующий смыслу), дополнение (что/где/когда), или тип (утверждение/вопрос/отрицание).
Запрещено: повторять дословно исходную фразу; создавай новый пример той же сложности.
Дай строго JSON { "german": "...", "russian": "..." } без лишнего текста.`;
    const data = await callModelJSON(prompt, { temperature: 0.6 });
    const valid = validatePhraseJson(data);
    if (setter) setter({ loading: false, data: valid, error: null });
  } catch (error) {
    console.error("Fetch Similar Phrase Error:", error);
    if (setter)
      setter({
        loading: false,
        data: null,
        error: error.message || "Не удалось сгенерировать похожую фразу",
      });
  }
}

// Совместимость со старым именем
export const generateSimilarPhrase = fetchSimilarPhrase;

// --- Чат с Gemini: краткие методические ответы ---
export async function fetchGeminiChat({ message, conversationHistory = [] }) {
  const historyText = Array.isArray(conversationHistory)
    ? conversationHistory
        .map((m) =>
          m.type === "user"
            ? `Пользователь: ${m.content}`
            : `Ассистент: ${m.content}`
        )
        .join("\n")
    : "";

  const prompt = `${
    historyText ? `Контекст диалога:\n${historyText}\n\n` : ""
  }Ты опытный преподаватель немецкого (A1-A2, метод Петрова). Отвечай кратко (1-3 предложения), просто, с примерами, при необходимости.
Немецкие фразы и слова заключай в кавычки. Если просят объяснение фразы, разложи по пунктам: спряжение, порядок слов, отрицание и т.п.
Вопрос: ${message}`;

  try {
    if (!process.env.REACT_APP_GEMINI_API_KEY) {
      console.warn("Gemini: REACT_APP_GEMINI_API_KEY не найден в окружении");
      return "API ключ не настроен. Укажите REACT_APP_GEMINI_API_KEY и перезапустите dev-сервер.";
    }

    const text = await callModelText(prompt, {
      temperature: 0.5,
      maxOutputTokens: 768,
    });
    return text.trim();
  } catch (error) {
    console.error("fetchGeminiChat error:", error);
    const errStr = (error?.message || "").toLowerCase();
    if (
      errStr.includes("overloaded") ||
      errStr.includes("unavailable") ||
      errStr.includes("503")
    ) {
      return "Сервер перегружен. Пожалуйста, попробуйте позже.";
    }
    return "Извините, не удалось получить ответ. Попробуйте ещё раз.";
  }
}

// Генерация фразы по учебной программе (каркас)
export async function generateCurriculumPhrase({
  level = "A1",
  topic = "present_simple",
  constraints = {},
}) {
  const rules = {
    A1: `Только простые предложения 2-4 слова. Настоящее время. Допускаются модальные с обязательным инфинитивом. Без сложных дополнений. Отрицание: nicht/kein корректно.`,
  };
  const targets = {
    present_simple: `Утверждение/вопрос/отрицание в Präsens. Одно естественное короткое предложение.`,
    modal_basic: `Модальные глаголы (können/müssen/wollen) только с инфинитивом в конце. Одно короткое предложение.`,
    negation_basic: `Правильный выбор между nicht/kein. Одно короткое предложение.`,
  };
  const goal = targets[topic] || targets.present_simple;
  const avoid =
    Array.isArray(constraints.avoid) && constraints.avoid.length
      ? `Не повторяй эти фразы (или почти идентичные): ${constraints.avoid
          .map((s) => `"${s}"`)
          .join(", ")}.`
      : "";

  const prompt = `Ты методист A1. Сгенерируй ОДНО очень простое естественное предложение на немецком (и перевод) в JSON { "german":"...","russian":"..." }.
Уровень: ${level}.
Цель: ${goal}
Правила уровня: ${rules[level] || rules.A1}
${avoid}
Требование по лексике: если есть существительные — используй корректные формы с артиклем в единственном числе, где это естественно (der/die/das). Множественное допускается только если это существенно для смысла.
Запрещено: сложные дополнения, подчинённые предложения, неестественные коллокации. Дай только JSON.`;

  const data = await callModelJSON(prompt, {
    maxOutputTokens: 200,
    temperature: 0.4,
  });
  return data;
}
