// Constants for the German Verbs Trainer

// List of pronouns with English translation and base key
export const pronouns = [
  { german: "ich", english: "I", base: "ich" },
  { german: "du", english: "you (singular, informal)", base: "du" },
  { german: "er/sie/es", english: "he/she/it", base: "er" },
  { german: "wir", english: "we", base: "wir" },
  { german: "ihr", english: "you (plural, informal)", base: "ihr" },
  { german: "sie/Sie", english: "they/You (formal)", base: "sie" },
];

// Order of difficulty levels
export const LEVEL_ORDER = ["A1", "A2", "B1", "B2"];

// Requirements for leveling up
export const LEVEL_UP_REQUIREMENTS = { correctAnswers: 25, accuracy: 0.8 };

// Returns a human-readable label for the verb type
export function getVerbTypeLabel(type) {
  switch (type) {
    case "weak":
      return "Weak verb";
    case "strong":
      return "Strong verb";
    case "mixed":
      return "Mixed verb";
    case "modal":
      return "Modal verb";
    case "irregular":
      return "Irregular verb";
    case "separable":
      return "Separable verb";
    case "regular":
      return "Regular verb";
    default:
      return "Type not specified";
  }
}
