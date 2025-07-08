// API-функции для работы с Gemini (Google AI)

/**
 * Получить подробную информацию о глаголе через Gemini
 * @param {object} verb - объект глагола
 * @param {object} geminiDataCache - кэш данных Gemini
 * @param {function} setGeminiDataCache - функция для обновления кэша
 * @param {function} setter - функция для установки состояния в компоненте
 * @param {boolean} force - форсировать обновление
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
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    setter({
      loading: false,
      data: null,
      error: "API ключ не настроен в файле .env",
    });
    return;
  }
  const prompt = `
    Для немецкого глагола '${verb.infinitive}' (${verb.russian}), создай JSON объект.
    Этот объект должен содержать два ключа: "verb_info" и "examples".
    
    1. "verb_info": объект с двумя полями:
       - "type": тип глагола на русском ("слабый", "сильный" или "смешанный").
       - "regularity": на русском ("правильный" или "неправильный").
    
    2. "examples": массив примеров. Создай по одному примеру для каждого местоимения: ich, du, er/sie/es, wir, ihr, sie/Sie.
    
    Каждый элемент в массиве "examples" должен быть объектом со следующей структурой:
    - "pronoun": "ich" (например)
    - "german_initial": "простое предложение в настоящем времени БЕЗ МЕСТОИМЕНИЯ, где глагол или его части обернуты в теги <b></b>."
    - "russian": "полный перевод этого предложения"
    - "forms": вложенный объект, содержащий 3 времени (present, past, future), где глаголы также обернуты в <b></b>.

    Структура объекта "forms":
    - "present": { "question": "...", "affirmative": "...", "negative": "..." }
    - "past": { "question": "...", "affirmative": "...", "negative": "..." } (используй Perfekt)
    - "future": { "question": "...", "affirmative": "...", "negative": "..." } (используй Futur I)

    Пример для "ich komme":
    {
      "verb_info": { "type": "сильный", "regularity": "неправильный" },
      "examples": [
        {
          "pronoun": "ich",
          "german_initial": "<b>komme</b> nach Hause.",
          "russian": "Я иду домой.",
          "forms": {
            "present": { "question": "<b>Komme</b> ich nach Hause?", "affirmative": "Ich <b>komme</b> nach Hause.", "negative": "Ich <b>komme</b> nicht nach Hause." },
            "past": { "question": "<b>Bin</b> ich nach Hause <b>gekommen</b>?", "affirmative": "Ich <b>bin</b> nach Hause <b>gekommen</b>.", "negative": "Ich <b>bin</b> nicht nach Hause <b>gekommen</b>." },
            "future": { "question": "<b>Werde</b> ich nach Hause <b>kommen</b>?", "affirmative": "Ich <b>werde</b> nach Hause <b>kommen</b>.", "negative": "Ich <b>werde</b> nicht nach Hause <b>kommen</b>." }
          }
        }
      ]
    }
    Создай полный JSON с такой структурой для всех местоимений для глагола '${verb.infinitive}'.
  `;
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  };
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok)
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    const result = await response.json();
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Пустой или некорректный ответ от Gemini.");
    }
    let parsedJson;
    try {
      parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
    } catch (e) {
      console.error(
        "Failed to parse JSON from Gemini:",
        result.candidates[0].content.parts[0].text
      );
      throw new Error("Не удалось обработать ответ от Gemini (неверный JSON).");
    }
    if (Array.isArray(parsedJson)) parsedJson = parsedJson[0];
    if (
      !parsedJson ||
      !parsedJson.examples ||
      !Array.isArray(parsedJson.examples)
    ) {
      throw new Error("Некорректный формат данных от Gemini.");
    }
    setGeminiDataCache((prev) => ({ ...prev, [verb.infinitive]: parsedJson }));
    setter({ loading: false, data: parsedJson, error: null });
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
 * @param {object} verb - объект глагола
 * @param {object} pronoun - объект местоимения
 * @param {object} verbFormsCache - кэш форм глаголов
 * @param {function} setVerbFormsCache - функция для обновления кэша
 * @param {function} setter - функция для установки состояния в компоненте
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
  if (
    verbFormsCache[verb.infinitive] &&
    verbFormsCache[verb.infinitive][pronounKey]
  ) {
    setter({
      loading: false,
      data: verbFormsCache[verb.infinitive][pronounKey],
      error: null,
    });
    return;
  }
  setter({ loading: true, data: null, error: null });
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    setter({ loading: false, data: null, error: "API ключ не настроен." });
    return;
  }
  const prompt = `
    Для немецкого глагола "${verb.infinitive}" и местоимения "${pronounDisplay}", создай JSON объект с его формами в разных временах.
    Используй "${pronounDisplay}" в тексте ответа.

    Объект должен иметь ключ "forms", который содержит три вложенных объекта: "present", "past" и "future".
    Каждый из этих объектов должен содержать три строковых поля: "question", "affirmative", "negative".

    - Для "past" используй время Perfekt.
    - Для "future" используй время Futur I.
    - В каждой строке выдели сам глагол или его изменяемые части тегом <b></b>.

    Пример для глагола "gehen" и местоимения "er/sie/es":
    {
      "forms": {
        "present": {
          "question": "<b>Geht</b> er/sie/es?",
          "affirmative": "Er/sie/es <b>geht</b>.",
          "negative": "Er/sie/es <b>geht</b> nicht."
        },
        "past": {
          "question": "<b>Ist</b> er/sie/es <b>gegangen</b>?",
          "affirmative": "Er/sie/es <b>ist</b> <b>gegangen</b>.",
          "negative": "Er/sie/es <b>ist</b> nicht <b>gegangen</b>."
        },
        "future": {
          "question": "<b>Wird</b> er/sie/es <b>gehen</b>?",
          "affirmative": "Er/sie/es <b>wird</b> <b>gehen</b>.",
          "negative": "Er/sie/es <b>wird</b> не <b>gehen</b>."
        }
      }
    }

    Сгенерируй такой JSON для глагола "${verb.infinitive}" и местоимения "${pronounDisplay}".
  `;
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  };
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const result = await response.json();
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Пустой ответ от Gemini для форм глагола.");
    }
    const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
    setVerbFormsCache((prev) => ({
      ...prev,
      [verb.infinitive]: { ...prev[verb.infinitive], [pronounKey]: parsedJson },
    }));
    setter({ loading: false, data: parsedJson, error: null });
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
 * Получить объяснение ошибки для практики через Gemini
 * @param {string} prompt - промпт с вопросом об ошибке
 * @param {function} setter - функция для установки состояния
 */
export async function fetchExplanation({ prompt, setter }) {
  if (!prompt) {
    setter("");
    return;
  }

  setter("Загружаю объяснение...");
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

  if (!apiKey) {
    setter("API ключ не настроен");
    return;
  }

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 200,
    },
  };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Пустой ответ от Gemini");
    }

    const explanation = result.candidates[0].content.parts[0].text.trim();
    setter(explanation);
  } catch (error) {
    console.error("Fetch Explanation Error:", error);
    setter("Не удалось получить объяснение");
  }
}

/**
 * Получить контекстные примеры с подсветкой глаголов для практики
 * @param {object} verb - объект глагола
 * @param {string} pronoun - местоимение
 * @param {string} correctForm - правильная форма
 * @param {string} wrongForm - неправильная форма
 * @param {function} setter - функция для установки состояния
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

  // Сначала показываем базовый пример
  setter(`<b>${correctForm}</b> - правильная форма для "${pronoun}"`);

  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

  if (!apiKey) {
    setter(`<b>${correctForm}</b> - правильная форма для "${pronoun}"`);
    return;
  }

  const prompt = `Создай 3 простых примера предложений на немецком языке, где используется глагол "${verb.infinitive}" с местоимением "${pronoun}" в форме "${correctForm}". 

В каждом предложении выдели глагол жирным шрифтом, используя теги <b></b>.

Примеры должны быть простыми и понятными для изучения немецкого языка.

Формат ответа:
1. <b>${correctForm}</b> nach Hause.
2. Ich <b>${correctForm}</b> zur Schule.
3. Er <b>${correctForm}</b> ins Kino.`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 150,
    },
  };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Пустой ответ от Gemini");
    }

    const examples = result.candidates[0].content.parts[0].text.trim();
    setter(examples);
  } catch (error) {
    console.error("Fetch Context Examples Error:", error);
    setter(`<b>${correctForm}</b> - правильная форма для "${pronoun}"`);
  }
}
