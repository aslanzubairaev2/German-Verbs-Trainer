import {
  PHRASE_VOCAB,
  getRandomTemplate,
  randomFrom,
} from "../constants/phraseVocabulary.js";

// Единый клиент Gemini: GemeniGen (REST)
const MODEL_NAME = "gemini-2.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function getApiKey() {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API ключ не настроен в .env");
  return apiKey;
}

async function requestModel({ prompt, generationConfig = {} }) {
  const apiKey = getApiKey();
  const url = `${API_BASE}/${MODEL_NAME}:generateContent?key=${apiKey}`;
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
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  const result = await response.json();
  const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!raw) throw new Error("Пустой ответ от Gemini");
  return raw;
}

function stripCodeFence(raw) {
  if (!raw.startsWith("```")) return raw;
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

async function callModelJSON(prompt, options = {}) {
  const raw = await requestModel({
    prompt,
    generationConfig: { responseMimeType: "application/json", ...options },
  });
  const cleaned = stripCodeFence(raw);
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch (e) {
    throw new Error("Не удалось распарсить JSON от Gemini");
  }
}

async function callModelText(prompt, options = {}) {
  const raw = await requestModel({ prompt, generationConfig: { ...options } });
  return raw;
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
    if (!data?.examples || !Array.isArray(data.examples)) {
      throw new Error("Некорректный формат данных от Gemini");
    }
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
    setter({ loading: false, data, error: null });
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
    const prompt = `Возьми фразу: "${basePhrase?.german || ""}" (${
      basePhrase?.russian || ""
    }) и создай ещё одну ОЧЕНЬ ПРОСТУЮ естественную фразу уровня A1 в том же стиле.
Дай JSON строго { "german": "...", "russian": "..." }.`;
    const data = await callModelJSON(prompt, { temperature: 0.5 });
    setter(data);
  } catch (error) {
    console.error("Fetch Similar Phrase Error:", error);
    setter(null);
  }
}
