// Константы для тренажёра немецких глаголов

// Список местоимений с русским переводом и базовым ключом
export const pronouns = [
  { german: "ich", russian: "я", base: "ich" },
  { german: "du", russian: "ты", base: "du" },
  { german: "er/sie/es", russian: "он/она/оно", base: "er" },
  { german: "wir", russian: "мы", base: "wir" },
  { german: "ihr", russian: "вы", base: "ihr" },
  { german: "sie/Sie", russian: "они/Вы", base: "sie" },
];

// Порядок уровней сложности
export const LEVEL_ORDER = ["A1", "A2", "B1", "B2"];

// Требования для перехода на следующий уровень
export const LEVEL_UP_REQUIREMENTS = { correctAnswers: 25, accuracy: 0.8 };
