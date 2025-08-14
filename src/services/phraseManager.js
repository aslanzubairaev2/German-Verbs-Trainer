// src/services/phraseManager.js

/**
 * @file Этот модуль отвечает за всю логику управления фразами:
 * - Инициализация и миграция данных
 * - Хранение и обновление прогресса пользователя в localStorage
 * - Реализация алгоритма Spaced Repetition
 * - Выбор следующей фразы для показа
 */

import { PHRASES } from "../phrases";

// Ключ для хранения данных в localStorage
const STORAGE_KEY = "phraseTrainerProgress";

// Хранилище данных в памяти для быстрого доступа
let phraseData = [];
let recentlyShownIds = [];
const RECENTLY_SHOWN_LIMIT = 20; // Не показывать последние 20 фраз

/**
 * Инициализирует менеджер фраз.
 * Загружает данные из localStorage или создает их из статического файла.
 */
export const initPhraseManager = () => {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (savedData) {
    try {
      phraseData = JSON.parse(savedData);
      console.log("Phrase data loaded from localStorage.");
    } catch (error) {
      console.error("Failed to parse phrase data from localStorage", error);
      // Если парсинг не удался, создаем данные заново
      createInitialData();
    }
  } else {
    createInitialData();
  }
};

/**
 * Создает начальный набор данных из PHRASES, обогащая их полями для статистики.
 */
const createInitialData = () => {
  console.log("Creating initial phrase data...");
  phraseData = PHRASES.map((phrase, index) => {
    const { pronoun, verb } = extractMetadata(phrase);
    return {
      id: `${index}-${phrase.german.slice(0, 10)}`, // Простой уникальный ID
      russian: phrase.russian,
      german: phrase.german,
      pronoun,
      verb,
      difficulty: 0.5, // TODO: implement auto-calculation

      // Статистика
      status: "new", // 'new' | 'learning' | 'learned' | 'mastered'
      viewCount: 0,
      understoodCount: 0,
      skippedCount: 0,
      lastShown: null,
      nextReview: null, // Дата следующего показа
    };
  });
  saveData();
  console.log("Initial phrase data created and saved.");
};

/**
 * Извлекает метаданные (местоимение и глагол) из фразы.
 * @param {object} phrase - Исходный объект фразы
 * @returns {{pronoun: string|null, verb: string|null}}
 */
const extractMetadata = (phrase) => {
  // Простой эвристический анализ на основе текста
  const germanWords = phrase.german
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .split(" ");

  const pronouns = ["ich", "du", "er", "sie", "es", "wir", "ihr", "Sie"];

  const foundPronoun =
    germanWords.find((word) => pronouns.includes(word)) || null;

  // Для глагола ищем второе слово в простых фразах, где есть местоимение
  let foundVerb = null;
  if (foundPronoun && germanWords.length > 1) {
    const pronounIndex = germanWords.indexOf(foundPronoun);
    // Если местоимение - первое слово, то глагол, скорее всего, второе.
    if (pronounIndex === 0 && germanWords.length > 1) {
      foundVerb = germanWords;
    }
  }

  return { pronoun: foundPronoun, verb: foundVerb };
};

/**
 * Сохраняет текущее состояние данных в localStorage.
 */
const saveData = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(phraseData));
  } catch (error) {
    console.error("Failed to save phrase data to localStorage", error);
  }
};

// Инициализация при загрузке модуля
initPhraseManager();

// --- API для взаимодействия с UI ---

/**
 * Выбирает следующую фразу для показа пользователю.
 * @param {object} settings - Настройки пользователя.
 * @returns {object|null} - Объект фразы или null, если подходящей фразы нет.
 */
export const selectNextPhrase = (settings = {}) => {
  const now = new Date();

  // 1. Фильтрация кандидатов
  let candidates = phraseData.filter((phrase) => {
    // Исключить недавно показанные
    if (recentlyShownIds.includes(phrase.id)) {
      return false;
    }
    // Проверить, не пора ли повторять фразу
    if (phrase.nextReview && new Date(phrase.nextReview) > now) {
      return false;
    }
    // Фильтрация по настройкам
    if (settings && settings.mode === "custom") {
      const { pronouns } = settings;
      const activePronouns = Object.keys(pronouns).filter((p) => pronouns[p]);
      if (
        activePronouns.length > 0 &&
        !activePronouns.includes(phrase.pronoun)
      ) {
        return false;
      }
      // TODO: Add verb filtering
    }
    return true;
  });

  // Если нет подходящих фраз для повторения, попробуем показать новые
  if (candidates.length === 0) {
    candidates = phraseData.filter(
      (phrase) =>
        phrase.status === "new" && !recentlyShownIds.includes(phrase.id)
    );
  }

  // Если и новых нет, сбрасываем список "недавно показанных" и пробуем снова
  if (candidates.length === 0) {
    recentlyShownIds = [];
    candidates = phraseData.filter((phrase) => {
      if (phrase.nextReview && new Date(phrase.nextReview) > now) return false;
      return true;
    });
    if (candidates.length === 0) {
      // В крайнем случае, если вообще ничего нет, показываем любую фразу
      candidates = phraseData;
    }
  }

  // 2. Приоритезация
  const priorities = {
    new: 4,
    learning: 3,
    learned: 2,
    mastered: 1,
  };

  // Взвешенный случайный выбор
  const weightedList = candidates.flatMap((phrase) =>
    Array(priorities[phrase.status] || 1).fill(phrase)
  );

  if (weightedList.length === 0) {
    return null; // Нет доступных фраз
  }

  const randomIndex = Math.floor(Math.random() * weightedList.length);
  const nextPhrase = weightedList[randomIndex];

  // Обновляем список недавно показанных
  recentlyShownIds.push(nextPhrase.id);
  if (recentlyShownIds.length > RECENTLY_SHOWN_LIMIT) {
    recentlyShownIds.shift(); // Удаляем самый старый элемент
  }

  // Обновляем lastShown для выбранной фразы
  nextPhrase.lastShown = now.toISOString();

  return nextPhrase;
};

/**
 * Обрабатывает нажатие кнопки "Понятно".
 * @param {string} phraseId - ID обработанной фразы.
 */
export const handleUnderstood = (phraseId) => {
  const phrase = phraseData.find((p) => p.id === phraseId);
  if (!phrase) return;

  phrase.understoodCount++;
  phrase.viewCount++;
  phrase.lastShown = new Date().toISOString();

  // Обновляем статус
  if (phrase.status === "new") {
    phrase.status = "learning";
  } else if (phrase.status === "learning") {
    phrase.status = "learned";
  } else if (phrase.status === "learned" && phrase.understoodCount >= 3) {
    phrase.status = "mastered";
  }

  // Рассчитываем следующий показ (упрощенная система интервалов)
  const intervals = {
    1: 1, // 1 день
    2: 3, // 3 дня
    3: 7, // 1 неделя
    4: 14, // 2 недели
    5: 30, // 1 месяц
  };
  const intervalDays = intervals[phrase.understoodCount] || 60; // по умолчанию 2 месяца
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
  phrase.nextReview = nextReviewDate.toISOString();

  console.log(
    `Phrase ${phrase.id} marked as understood. Next review: ${phrase.nextReview}`
  );
  saveData();
};

/**
 * Обрабатывает нажатие кнопки "Новый пример".
 * @param {string} phraseId - ID обработанной фразы.
 */
export const handleNewExample = (phraseId) => {
  const phrase = phraseData.find((p) => p.id === phraseId);
  if (!phrase) return;

  phrase.skippedCount++;
  phrase.viewCount++;
  phrase.lastShown = new Date().toISOString();

  // Если фраза была новая, она становится изучаемой
  if (phrase.status === "new") {
    phrase.status = "learning";
  }

  // Возвращаем фразу в очередь через 20 минут
  const nextReviewDate = new Date(Date.now() + 20 * 60 * 1000);
  phrase.nextReview = nextReviewDate.toISOString();

  console.log(
    `Phrase ${phrase.id} marked as skipped. Next review: ${phrase.nextReview}`
  );
  saveData();
};
