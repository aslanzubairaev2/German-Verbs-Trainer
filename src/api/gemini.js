import { GoogleGenAI } from "@google/genai";
import {
  PHRASE_VOCAB,
  getRandomTemplate,
  randomFrom,
} from "../constants/phraseVocabulary.js";

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

// --- Основная функция генерации фразы ---
export async function fetchGeminiPhrase({ setter }) {
  setter({ loading: true, data: null, error: null });
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    setter({
      loading: false,
      data: null,
      error: "API ключ не настроен в .env",
    });
    return;
  }

  // 1. Получаем случайный шаблон фразы
  const template = getRandomTemplate();

  // 2. Собираем слова согласно шаблону
  const selectedWords = template.pattern.map((wordType) => {
    const wordArray = PHRASE_VOCAB[wordType];
    if (!wordArray) {
      console.error(`ОШИБКА: Неизвестный тип слова: ${wordType}`);
      console.error(`Доступные типы:`, Object.keys(PHRASE_VOCAB));
      return "ich"; // fallback
    }
    const selectedWord = randomFrom(wordArray);
    console.log(`Выбрано слово типа "${wordType}": "${selectedWord}"`);
    return selectedWord;
  });

  // Отладочная информация
  console.log("=== ОТЛАДКА ГЕНЕРАЦИИ ФРАЗЫ ===");
  console.log("Template:", template.key, template.description);
  console.log("Pattern:", template.pattern);
  console.log("Selected words:", selectedWords);
  console.log("Уникальные слова:", [...new Set(selectedWords)]);
  console.log("================================");

  // 3. Формируем промпт для Gemini
  const prompt = `
    Ты опытный лингвист и методолог, специализирующийся на преподавании немецкого языка для начинающих.
    
    Создай ОЧЕНЬ ПРОСТУЮ немецкую фразу для отработки спряжения глаголов (уровень A1, второй урок Петрова).
    
    Используй эти слова как основу: ${selectedWords.join(", ")}.
    Тип фразы: ${template.description}.
    
    КАК ЛИНГВИСТ, ТЫ ЗНАЕШЬ:
    - Какие фразы люди реально используют в речи
    - Какие конструкции звучат естественно, а какие искусственно
    - Как правильно сочетать слова для создания осмысленных фраз
    
    ПРАВИЛА (как в уроке Петрова):
    - ТОЛЬКО простые конструкции: Кто + Глагол + (Что/Где/Когда)
    - Простое спряжение глаголов в настоящем времени
    - Без сложных дополнений, без косвенных падежей
    - Без сложных предлогов и конструкций
    - Короткие фразы (2-4 слова максимум)
    - Если используешь модальный глагол - ОБЯЗАТЕЛЬНО добавь основной глагол
    - Фраза должна звучать ЕСТЕСТВЕННО, как в реальной речи
    - Отрицания: "nicht" с глаголами, "kein" с существительными
    
    ЕСТЕСТВЕННЫЕ ФРАЗЫ (ДЕЛАЙ ТАК):
    - "Ich gehe" (Я иду)
    - "Du arbeitest" (Ты работаешь)
    - "Er liest ein Buch" (Он читает книгу)
    - "Sie trinkt Kaffee" (Она пьёт кофе)
    - "Wo arbeitest du?" (Где ты работаешь?)
    - "Wann kommst du?" (Когда ты приходишь?)
    - "Ich habe Geld" (У меня есть деньги)
    - "Du kannst Geld verdienen" (Ты можешь зарабатывать деньги)
    - "Du musst zur Schule gehen" (Ты должен идти в школу)
    - "Du kommst nicht" (Ты не приходишь) - richtig!
    - "Ich habe kein Geld" (У меня нет денег) - richtig!
    - "Du arbeitest nicht" (Ты не работаешь) - richtig!
    
    НЕЕСТЕСТВЕННЫЕ ФРАЗЫ (НЕ ДЕЛАЙ ТАК):
    - "Du kannst Geld haben" (Ты можешь иметь деньги) - неестественно
    - "Ich kann Zeit haben" (Я могу иметь время) - неестественно
    - "Du kommst kein" (Ты не приходишь) - неправильно! Должно быть "Du kommst nicht"
    - "Ich habe nicht Geld" (У меня нет денег) - неправильно! Должно быть "Ich habe kein Geld"
    - "Er gibt mir niemals Geld zum Supermarkt" (слишком сложно)
    - "Ihr könnt Geld" (неполная фраза)
    
    Цель: отработка простого спряжения глаголов до автоматизма через ЕСТЕСТВЕННЫЕ фразы.
    
    Дай JSON вида: { "german": "...", "russian": "..." }
    Не добавляй ничего кроме JSON.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: prompt,
    });

    // Новый формат: JSON приходит в response.candidates[0].content.parts[0].text
    const rawText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Пустой ответ от Gemini");
    }

    // Удаляем обёртку ```json ... ``` если она есть
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText
        .replace(/^```json\s*/, "")
        .replace(/```$/, "")
        .trim();
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText
        .replace(/^```\s*/, "")
        .replace(/```$/, "")
        .trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (e) {
      throw new Error("Не удалось распарсить JSON от Gemini");
    }

    setter({ loading: false, data: parsed, error: null });
  } catch (error) {
    console.error("Fetch Gemini Phrase Error:", error);
    setter({
      loading: false,
      data: null,
      error: error.message || "Не удалось получить фразу от Gemini.",
    });
  }
}

/**
 * Сгенерировать похожую фразу на основе существующей через Gemini
 * @param {object} basePhrase - базовая фраза для генерации похожих
 * @param {function} setter - функция для установки состояния
 */
export async function generateSimilarPhrase({ basePhrase, setter }) {
  setter({ loading: true, data: null, error: null });
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    setter({
      loading: false,
      data: null,
      error: "API ключ не настроен в .env",
    });
    return;
  }

  if (!basePhrase || !basePhrase.german) {
    setter({
      loading: false,
      data: null,
      error: "Базовая фраза не определена",
    });
    return;
  }

  const prompt = `
    Ты опытный лингвист и методолог, специализирующийся на преподавании немецкого языка для начинающих.
    
    Создай ПОХОЖУЮ немецкую фразу на основе этой: "${basePhrase.german}" (${basePhrase.russian}).
    
    КАК ЛИНГВИСТ, ТЫ ЗНАЕШЬ:
    - Какие фразы люди реально используют в речи
    - Какие конструкции звучат естественно
    - Как правильно сочетать слова для создания осмысленных фраз
    
    ПРАВИЛА ГЕНЕРАЦИИ ПОХОЖЕЙ ФРАЗЫ:
    - Сохрани ТОЧНО ТАКУЮ ЖЕ структуру и тип фразы
    - Используй ТОТ ЖЕ тип времени (настоящее/прошедшее/будущее)
    - Сохрани ТОТ ЖЕ тип (утверждение/вопрос/отрицание)
    - Замени только ключевые слова, но сохрани грамматическую структуру
    - Фраза должна быть ТАКОЙ ЖЕ сложности (уровень A1)
    - Используй ТОЛЬКО простые конструкции из второго урока Петрова
    
    ПРИМЕРЫ:
    Если базовая фраза: "Ich gehe zur Schule." (Я иду в школу)
    То похожие: "Du gehst zur Arbeit." (Ты идёшь на работу)
                "Er geht ins Kino." (Он идёт в кино)
                "Sie geht zum Arzt." (Она идёт к врачу)
    
    Если базовая фраза: "Wann kommst du?" (Когда ты приходишь?)
    То похожие: "Wann gehst du?" (Когда ты идёшь?)
                "Wann arbeitest du?" (Когда ты работаешь?)
                "Wann trinkst du?" (Когда ты пьёшь?)
    
    Если базовая фраза: "Ich habe kein Geld." (У меня нет денег)
    То похожие: "Du hast keine Zeit." (У тебя нет времени)
                "Er hat kein Auto." (У него нет машины)
                "Sie hat kein Buch." (У неё нет книги)
    
    Цель: создать ЕСТЕСТВЕННУЮ фразу с ТОЧНО ТАКОЙ ЖЕ структурой.
    
    Дай JSON вида: { "german": "...", "russian": "..." }
    Не добавляй ничего кроме JSON.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: prompt,
    });

    const rawText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Пустой ответ от Gemini");
    }

    // Удаляем обёртку ```json ... ``` если она есть
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText
        .replace(/^```json\s*/, "")
        .replace(/```$/, "")
        .trim();
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText
        .replace(/^```\s*/, "")
        .replace(/```$/, "")
        .trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (e) {
      throw new Error("Не удалось распарсить JSON от Gemini");
    }

    setter({ loading: false, data: parsed, error: null });
  } catch (error) {
    console.error("Generate Similar Phrase Error:", error);
    setter({
      loading: false,
      data: null,
      error: error.message || "Не удалось сгенерировать похожую фразу.",
    });
  }
}
