// --- Расширенный словарь для генерации немецких фраз (урок 2 Петрова) ---
// Содержит все необходимые слова для построения простых фраз: вопросы, утверждения,
// фразы с обстоятельствами времени/места, с косвенными местоимениями и т.д.

export const PHRASE_VOCAB = {
  // Основные местоимения (кто)
  pronouns: ["ich", "du", "er", "sie", "es", "wir", "ihr", "Sie"],

  // Косвенные местоимения (кому, мне, ему, ей и т.д.)
  indirectPronouns: ["mir", "dir", "ihm", "ihr", "uns", "euch", "ihnen"],

  // Притяжательные местоимения (мой, твой, его, её и т.д.)
  possessivePronouns: ["mein", "dein", "sein", "ihr", "unser", "euer", "ihr"],

  // Основные глаголы (что делает) - расширенный список
  verbs: [
    "gehen",
    "kommen",
    "machen",
    "arbeiten",
    "wohnen",
    "sprechen",
    "trinken",
    "essen",
    "sein",
    "haben",
    "lernen",
    "studieren",
    "besuchen",
    "treffen",
    "sehen",
    "hören",
    "lesen",
    "schreiben",
    "fahren",
    "laufen",
    "stehen",
    "sitzen",
    "liegen",
    "schlafen",
    "wachen",
    "kochen",
    "kaufen",
    "verkaufen",
    "finden",
    "suchen",
    "helfen",
    "brauchen",
    "wollen",
    "mögen",
    "lieben",
    "hassen",
    "verstehen",
    "wissen",
    "denken",
    "glauben",
    "sagen",
    "fragen",
    "antworten",
    "erzählen",
    "zeigen",
    "geben",
    "nehmen",
    "bringen",
    "holen",
    "öffnen",
    "schließen",
    "beginnen",
    "enden",
    "starten",
    "stoppen",
    "warten",
    "bleiben",
    "verlassen",
    "ankommen",
    "abfahren",
  ],

  // Вопросительные слова (кто, где, когда, почему, что, как)
  questionWords: [
    "wer",
    "wo",
    "wann",
    "warum",
    "was",
    "wie",
    "wohin",
    "woher",
    "welche",
    "welcher",
    "welches",
  ],

  // Временные маркеры (когда)
  timeMarkers: [
    "gestern",
    "heute",
    "morgen",
    "jetzt",
    "später",
    "früher",
    "am Montag",
    "am Dienstag",
    "am Mittwoch",
    "am Donnerstag",
    "am Freitag",
    "am Samstag",
    "am Sonntag",
  ],

  // Объекты и дополнения (что, куда, к кому) - расширенный список
  objects: [
    "zur Schule",
    "nach Hause",
    "zur Arbeit",
    "zum Arzt",
    "ins Kino",
    "in die Stadt",
    "zum Supermarkt",
    "zur Universität",
    "Wasser",
    "Kaffee",
    "Brot",
    "Deutsch",
    "mit dem Auto",
    "mit dem Bus",
    "ein Buch",
    "eine Zeitung",
    "Musik",
    "Fernsehen",
    "Radio",
    "Telefon",
    "Computer",
    "Internet",
    "Zeitung",
    "Zeitschrift",
    "Brief",
    "Email",
    "Geld",
    "Zeit",
    "Freunde",
    "Familie",
    "Eltern",
    "Kinder",
    "Bruder",
    "Schwester",
    "Vater",
    "Mutter",
    "Haus",
    "Wohnung",
    "Zimmer",
    "Küche",
    "Bad",
    "Schlafzimmer",
    "Wohnzimmer",
    "Garten",
    "Balkon",
    "Tür",
    "Fenster",
    "Tisch",
    "Stuhl",
    "Sofa",
    "Bett",
    "Schrank",
    "Regal",
    "Lampe",
    "Uhr",
    "Bild",
    "Foto",
    "Karte",
    "Schlüssel",
    "Tasche",
    "Kleidung",
    "Schuhe",
    "Hut",
    "Brille",
    "Ring",
    "Uhr",
    "Geldbörse",
    "Handy",
    "Laptop",
    "Kamera",
    "Sport",
    "Fußball",
    "Tennis",
    "Schwimmen",
    "Laufen",
    "Fahrrad",
    "Wandern",
    "Reisen",
    "Urlaub",
    "Ferien",
    "Wetter",
    "Sonne",
    "Regen",
    "Schnee",
    "Wind",
    "Kälte",
    "Wärme",
    "Frühling",
    "Sommer",
    "Herbst",
    "Winter",
  ],

  // Модальные глаголы и вспомогательные слова
  modalVerbs: ["müssen", "sollen", "können", "wollen", "möchten", "dürfen"],

  // Отрицания и связки
  negations: ["nicht", "kein", "nie", "niemals"],
  conjunctions: ["und", "oder", "aber", "denn", "weil", "wenn"],

  // Дополнительные слова для разнообразия
  adverbs: [
    "auch",
    "schon",
    "noch",
    "immer",
    "manchmal",
    "oft",
    "selten",
    "gern",
    "lieber",
    "am liebsten",
    "sehr",
    "zu",
    "zu viel",
    "zu wenig",
    "genug",
    "fast",
    "fast nie",
    "fast immer",
  ],
};

// --- Шаблоны для построения разных типов фраз ---
export const PHRASE_TEMPLATES = {
  // Простое утверждение: Я иду в школу
  simple: {
    pattern: ["pronouns", "verbs", "objects"],
    description: "Простое утверждение в настоящем времени",
  },

  // Вопрос: Где ты был вчера?
  question: {
    pattern: ["questionWords", "pronouns", "verbs", "timeMarkers"],
    description: "Вопросительное предложение",
  },

  // С обстоятельством времени: Я работаю завтра
  withTime: {
    pattern: ["pronouns", "verbs", "objects", "timeMarkers"],
    description: "Утверждение с указанием времени",
  },

  // С косвенным местоимением: Мне надо к врачу
  withIndirect: {
    pattern: ["indirectPronouns", "modalVerbs", "objects"],
    description: "Фраза с косвенным местоимением",
  },

  // С притяжательным местоимением: Моя машина
  withPossessive: {
    pattern: ["possessivePronouns", "objects"],
    description: "Фраза с притяжательным местоимением",
  },

  // Отрицание: Я не иду в школу
  negative: {
    pattern: ["pronouns", "negations", "verbs", "objects"],
    description: "Отрицательное предложение",
  },
};

// --- Функция для получения случайного элемента из массива ---
export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Функция для получения случайного шаблона фразы ---
export function getRandomTemplate() {
  const templateKeys = Object.keys(PHRASE_TEMPLATES);
  const randomKey = randomFrom(templateKeys);
  return {
    key: randomKey,
    ...PHRASE_TEMPLATES[randomKey],
  };
}
