/**
 * API для работы с локальными фразами
 */

/**
 * Получить случайную фразу из локального файла phrases.js
 * @param {function} setter - функция для установки состояния
 * @param {string} filterType - опциональный фильтр по типу фразы (present, past, future, question, negative)
 */
export async function fetchLocalPhrase({ setter, filterType = null }) {
  setter({ loading: true, data: null, error: null });

  try {
    // Динамический импорт для избежания циклических зависимостей
    const { PHRASES } = await import("../phrases.js");

    let availablePhrases = PHRASES;

    // Применяем фильтр по типу, если указан
    if (filterType) {
      availablePhrases = PHRASES.filter((phrase) => phrase.type === filterType);
      if (availablePhrases.length === 0) {
        throw new Error(`Нет фраз типа "${filterType}"`);
      }
    }

    // Выбираем случайную фразу
    const randomIndex = Math.floor(Math.random() * availablePhrases.length);
    const selectedPhrase = availablePhrases[randomIndex];

    // Имитируем небольшую задержку для лучшего UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    setter({
      loading: false,
      data: {
        german: selectedPhrase.german,
        russian: selectedPhrase.russian,
      },
      error: null,
    });
  } catch (error) {
    console.error("Fetch Local Phrase Error:", error);
    setter({
      loading: false,
      data: null,
      error: error.message || "Не удалось получить фразу.",
    });
  }
}

/**
 * Получить статистику по фразам
 * @returns {Promise<Object>} объект со статистикой
 */
export async function getPhrasesStats() {
  try {
    const { PHRASES } = await import("../phrases.js");

    const stats = {
      total: PHRASES.length,
      byType: {},
    };

    // Подсчитываем количество фраз каждого типа
    PHRASES.forEach((phrase) => {
      if (!stats.byType[phrase.type]) {
        stats.byType[phrase.type] = 0;
      }
      stats.byType[phrase.type]++;
    });

    return stats;
  } catch (error) {
    console.error("Get Phrases Stats Error:", error);
    return { total: 0, byType: {} };
  }
}

/**
 * Получить фразы определённого типа
 * @param {string} type - тип фразы
 * @returns {Promise<Array>} массив фраз
 */
export async function getPhrasesByType(type) {
  try {
    const { PHRASES } = await import("../phrases.js");
    return PHRASES.filter((phrase) => phrase.type === type);
  } catch (error) {
    console.error("Get Phrases By Type Error:", error);
    return [];
  }
}
