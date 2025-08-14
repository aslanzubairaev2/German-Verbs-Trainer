// Константы для тренажёра немецких глаголов

// Порядок уровней сложности
export const LEVEL_ORDER = ["A1", "A2", "B1", "B2"];

// Требования для перехода на следующий уровень
export const LEVEL_UP_REQUIREMENTS = { correctAnswers: 25, accuracy: 0.8 };

// Возвращает человекочитаемое название типа глагола
export function getVerbTypeLabel(type) {
  switch (type) {
    case "weak":
      return "Слабый глагол";
    case "strong":
      return "Сильный глагол";
    case "mixed":
      return "Смешанный глагол";
    case "modal":
      return "Модальный глагол";
    case "irregular":
      return "Неправильный глагол";
    case "separable":
      return "Отделяемый глагол";
    case "regular":
      return "Правильный глагол";
    default:
      return "Тип не указан";
  }
}
