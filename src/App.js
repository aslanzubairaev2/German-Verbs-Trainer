import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  Volume2,
  VolumeX,
  Settings,
  Sparkles,
  LoaderCircle,
  Unlock,
} from "lucide-react";

// --- DATA ---
// Expanded pronoun list for better mobile layout
const pronouns = [
  { german: "ich", russian: "я" },
  { german: "du", russian: "ты" },
  { german: "er", russian: "он" },
  { german: "sie", russian: "она" },
  { german: "es", russian: "оно" },
  { german: "wir", russian: "мы" },
  { german: "ihr", russian: "вы" },
  { german: "sie", russian: "они" },
  { german: "Sie", russian: "Вы (вежл.)" },
];

// Massively expanded verb list with CEFR levels up to B2
const allVerbs = [
  // A1
  {
    infinitive: "sein",
    russian: "быть",
    level: "A1",
    forms: ["bin", "bist", "ist", "ist", "ist", "sind", "seid", "sind", "sind"],
  },
  {
    infinitive: "haben",
    russian: "иметь",
    level: "A1",
    forms: [
      "habe",
      "hast",
      "hat",
      "hat",
      "hat",
      "haben",
      "habt",
      "haben",
      "haben",
    ],
  },
  {
    infinitive: "werden",
    russian: "становиться",
    level: "A1",
    forms: [
      "werde",
      "wirst",
      "wird",
      "wird",
      "wird",
      "werden",
      "werdet",
      "werden",
      "werden",
    ],
  },
  {
    infinitive: "können",
    russian: "мочь",
    level: "A1",
    forms: [
      "kann",
      "kannst",
      "kann",
      "kann",
      "kann",
      "können",
      "könnt",
      "können",
      "können",
    ],
  },
  {
    infinitive: "müssen",
    russian: "быть должным",
    level: "A1",
    forms: [
      "muss",
      "musst",
      "muss",
      "muss",
      "muss",
      "müssen",
      "müsst",
      "müssen",
      "müssen",
    ],
  },
  {
    infinitive: "wollen",
    russian: "хотеть",
    level: "A1",
    forms: [
      "will",
      "willst",
      "will",
      "will",
      "will",
      "wollen",
      "wollt",
      "wollen",
      "wollen",
    ],
  },
  {
    infinitive: "sagen",
    russian: "сказать",
    level: "A1",
    forms: [
      "sage",
      "sagst",
      "sagt",
      "sagt",
      "sagt",
      "sagen",
      "sagt",
      "sagen",
      "sagen",
    ],
  },
  {
    infinitive: "machen",
    russian: "делать",
    level: "A1",
    forms: [
      "mache",
      "machst",
      "macht",
      "macht",
      "macht",
      "machen",
      "macht",
      "machen",
      "machen",
    ],
  },
  {
    infinitive: "geben",
    russian: "давать",
    level: "A1",
    forms: [
      "gebe",
      "gibst",
      "gibt",
      "gibt",
      "gibt",
      "geben",
      "gebt",
      "geben",
      "geben",
    ],
  },
  {
    infinitive: "kommen",
    russian: "приходить",
    level: "A1",
    forms: [
      "komme",
      "kommst",
      "kommt",
      "kommt",
      "kommt",
      "kommen",
      "kommt",
      "kommen",
      "kommen",
    ],
  },
  {
    infinitive: "gehen",
    russian: "идти",
    level: "A1",
    forms: [
      "gehe",
      "gehst",
      "geht",
      "geht",
      "geht",
      "gehen",
      "geht",
      "gehen",
      "gehen",
    ],
  },
  {
    infinitive: "wissen",
    russian: "знать",
    level: "A1",
    forms: [
      "weiß",
      "weißt",
      "weiß",
      "weiß",
      "weiß",
      "wissen",
      "wisst",
      "wissen",
      "wissen",
    ],
  },
  {
    infinitive: "sehen",
    russian: "видеть",
    level: "A1",
    forms: [
      "sehe",
      "siehst",
      "sieht",
      "sieht",
      "sieht",
      "sehen",
      "seht",
      "sehen",
      "sehen",
    ],
  },
  {
    infinitive: "finden",
    russian: "находить",
    level: "A1",
    forms: [
      "finde",
      "findest",
      "findet",
      "findet",
      "findet",
      "finden",
      "findet",
      "finden",
      "finden",
    ],
  },
  {
    infinitive: "bleiben",
    russian: "оставаться",
    level: "A1",
    forms: [
      "bleibe",
      "bleibst",
      "bleibt",
      "bleibt",
      "bleibt",
      "bleiben",
      "bleibt",
      "bleiben",
      "bleiben",
    ],
  },
  {
    infinitive: "heißen",
    russian: "называться",
    level: "A1",
    forms: [
      "heiße",
      "heißt",
      "heißt",
      "heißt",
      "heißt",
      "heißen",
      "heißt",
      "heißen",
      "heißen",
    ],
  },
  {
    infinitive: "denken",
    russian: "думать",
    level: "A1",
    forms: [
      "denke",
      "denkst",
      "denkt",
      "denkt",
      "denkt",
      "denken",
      "denkt",
      "denken",
      "denken",
    ],
  },
  {
    infinitive: "nehmen",
    russian: "брать",
    level: "A1",
    forms: [
      "nehme",
      "nimmst",
      "nimmt",
      "nimmt",
      "nimmt",
      "nehmen",
      "nehmt",
      "nehmen",
      "nehmen",
    ],
  },
  {
    infinitive: "tun",
    russian: "делать",
    level: "A1",
    forms: ["tue", "tust", "tut", "tut", "tut", "tun", "tut", "tun", "tun"],
  },
  {
    infinitive: "sprechen",
    russian: "говорить",
    level: "A1",
    forms: [
      "spreche",
      "sprichst",
      "spricht",
      "spricht",
      "spricht",
      "sprechen",
      "sprecht",
      "sprechen",
      "sprechen",
    ],
  },
  {
    infinitive: "fahren",
    russian: "ехать",
    level: "A1",
    forms: [
      "fahre",
      "fährst",
      "fährt",
      "fährt",
      "fährt",
      "fahren",
      "fahrt",
      "fahren",
      "fahren",
    ],
  },
  {
    infinitive: "fragen",
    russian: "спрашивать",
    level: "A1",
    forms: [
      "frage",
      "fragst",
      "fragt",
      "fragt",
      "fragt",
      "fragen",
      "fragt",
      "fragen",
      "fragen",
    ],
  },
  {
    infinitive: "arbeiten",
    russian: "работать",
    level: "A1",
    forms: [
      "arbeite",
      "arbeitest",
      "arbeitet",
      "arbeitet",
      "arbeitet",
      "arbeiten",
      "arbeitet",
      "arbeiten",
      "arbeiten",
    ],
  },
  {
    infinitive: "brauchen",
    russian: "нуждаться",
    level: "A1",
    forms: [
      "brauche",
      "brauchst",
      "braucht",
      "braucht",
      "braucht",
      "brauchen",
      "braucht",
      "brauchen",
      "brauchen",
    ],
  },
  {
    infinitive: "glauben",
    russian: "верить",
    level: "A1",
    forms: [
      "glaube",
      "glaubst",
      "glaubt",
      "glaubt",
      "glaubt",
      "glauben",
      "glaubt",
      "glauben",
      "glauben",
    ],
  },
  {
    infinitive: "helfen",
    russian: "помогать",
    level: "A1",
    forms: [
      "helfe",
      "hilfst",
      "hilft",
      "hilft",
      "hilft",
      "helfen",
      "helft",
      "helfen",
      "helfen",
    ],
  },
  {
    infinitive: "kaufen",
    russian: "покупать",
    level: "A1",
    forms: [
      "kaufe",
      "kaufst",
      "kauft",
      "kauft",
      "kauft",
      "kaufen",
      "kauft",
      "kaufen",
      "kaufen",
    ],
  },
  {
    infinitive: "lernen",
    russian: "учить",
    level: "A1",
    forms: [
      "lerne",
      "lernst",
      "lernt",
      "lernt",
      "lernt",
      "lernen",
      "lernt",
      "lernen",
      "lernen",
    ],
  },
  {
    infinitive: "lesen",
    russian: "читать",
    level: "A1",
    forms: [
      "lese",
      "liest",
      "liest",
      "liest",
      "liest",
      "lesen",
      "lest",
      "lesen",
      "lesen",
    ],
  },
  {
    infinitive: "schlafen",
    russian: "спать",
    level: "A1",
    forms: [
      "schlafe",
      "schläfst",
      "schläft",
      "schläft",
      "schläft",
      "schlafen",
      "schlaft",
      "schlafen",
      "schlafen",
    ],
  },
  {
    infinitive: "schreiben",
    russian: "писать",
    level: "A1",
    forms: [
      "schreibe",
      "schreibst",
      "schreibt",
      "schreibt",
      "schreibt",
      "schreiben",
      "schreibt",
      "schreiben",
      "schreiben",
    ],
  },
  {
    infinitive: "spielen",
    russian: "играть",
    level: "A1",
    forms: [
      "spiele",
      "spielst",
      "spielt",
      "spielt",
      "spielt",
      "spielen",
      "spielt",
      "spielen",
      "spielen",
    ],
  },
  {
    infinitive: "trinken",
    russian: "пить",
    level: "A1",
    forms: [
      "trinke",
      "trinkst",
      "trinkt",
      "trinkt",
      "trinkt",
      "trinken",
      "trinkt",
      "trinken",
      "trinken",
    ],
  },
  {
    infinitive: "wohnen",
    russian: "проживать",
    level: "A1",
    forms: [
      "wohne",
      "wohnst",
      "wohnt",
      "wohnt",
      "wohnt",
      "wohnen",
      "wohnt",
      "wohnen",
      "wohnen",
    ],
  },
  {
    infinitive: "zeigen",
    russian: "показывать",
    level: "A1",
    forms: [
      "zeige",
      "zeigst",
      "zeigt",
      "zeigt",
      "zeigt",
      "zeigen",
      "zeigt",
      "zeigen",
      "zeigen",
    ],
  },

  // A2
  {
    infinitive: "anrufen",
    russian: "звонить по телефону",
    level: "A2",
    forms: [
      "rufe an",
      "rufst an",
      "ruft an",
      "ruft an",
      "ruft an",
      "rufen an",
      "ruft an",
      "rufen an",
      "rufen an",
    ],
  },
  {
    infinitive: "beginnen",
    russian: "начинать",
    level: "A2",
    forms: [
      "beginne",
      "beginnst",
      "beginnt",
      "beginnt",
      "beginnt",
      "beginnen",
      "beginnt",
      "beginnen",
      "beginnen",
    ],
  },
  {
    infinitive: "bekommen",
    russian: "получать",
    level: "A2",
    forms: [
      "bekomme",
      "bekommst",
      "bekommt",
      "bekommt",
      "bekommt",
      "bekommen",
      "bekommt",
      "bekommen",
      "bekommen",
    ],
  },
  {
    infinitive: "bestellen",
    russian: "заказывать",
    level: "A2",
    forms: [
      "bestelle",
      "bestellst",
      "bestellt",
      "bestellt",
      "bestellt",
      "bestellen",
      "bestellt",
      "bestellen",
      "bestellen",
    ],
  },
  {
    infinitive: "bezahlen",
    russian: "платить",
    level: "A2",
    forms: [
      "bezahle",
      "bezahlst",
      "bezahlt",
      "bezahlt",
      "bezahlt",
      "bezahlen",
      "bezahlt",
      "bezahlen",
      "bezahlen",
    ],
  },
  {
    infinitive: "bitten",
    russian: "просить",
    level: "A2",
    forms: [
      "bitte",
      "bittest",
      "bittet",
      "bittet",
      "bittet",
      "bitten",
      "bittet",
      "bitten",
      "bitten",
    ],
  },
  {
    infinitive: "danken",
    russian: "благодарить",
    level: "A2",
    forms: [
      "danke",
      "dankst",
      "dankt",
      "dankt",
      "dankt",
      "danken",
      "dankt",
      "danken",
      "danken",
    ],
  },
  {
    infinitive: "einladen",
    russian: "приглашать",
    level: "A2",
    forms: [
      "lade ein",
      "lädst ein",
      "lädt ein",
      "lädt ein",
      "lädt ein",
      "laden ein",
      "ladet ein",
      "laden ein",
      "laden ein",
    ],
  },
  {
    infinitive: "erzählen",
    russian: "рассказывать",
    level: "A2",
    forms: [
      "erzähle",
      "erzählst",
      "erzählt",
      "erzählt",
      "erzählt",
      "erzählen",
      "erzählt",
      "erzählen",
      "erzählen",
    ],
  },
  {
    infinitive: "essen",
    russian: "есть, кушать",
    level: "A2",
    forms: [
      "esse",
      "isst",
      "isst",
      "isst",
      "isst",
      "essen",
      "esst",
      "essen",
      "essen",
    ],
  },
  {
    infinitive: "feiern",
    russian: "праздновать",
    level: "A2",
    forms: [
      "feiere",
      "feierst",
      "feiert",
      "feiert",
      "feiert",
      "feiern",
      "feiert",
      "feiern",
      "feiern",
    ],
  },
  {
    infinitive: "gefallen",
    russian: "нравиться",
    level: "A2",
    forms: [
      "gefalle",
      "gefällst",
      "gefällt",
      "gefällt",
      "gefällt",
      "gefallen",
      "gefallt",
      "gefallen",
      "gefallen",
    ],
  },
  {
    infinitive: "gehören",
    russian: "принадлежать",
    level: "A2",
    forms: [
      "gehöre",
      "gehörst",
      "gehört",
      "gehört",
      "gehört",
      "gehören",
      "gehört",
      "gehören",
      "gehören",
    ],
  },
  {
    infinitive: "gewinnen",
    russian: "выигрывать",
    level: "A2",
    forms: [
      "gewinne",
      "gewinnst",
      "gewinnt",
      "gewinnt",
      "gewinnt",
      "gewinnen",
      "gewinnt",
      "gewinnen",
      "gewinnen",
    ],
  },
  {
    infinitive: "hoffen",
    russian: "надеяться",
    level: "A2",
    forms: [
      "hoffe",
      "hoffst",
      "hofft",
      "hofft",
      "hofft",
      "hoffen",
      "hofft",
      "hoffen",
      "hoffen",
    ],
  },
  {
    infinitive: "kennenlernen",
    russian: "знакомиться",
    level: "A2",
    forms: [
      "lerne kennen",
      "lernst kennen",
      "lernt kennen",
      "lernt kennen",
      "lernt kennen",
      "lernen kennen",
      "lernt kennen",
      "lernen kennen",
      "lernen kennen",
    ],
  },
  {
    infinitive: "lachen",
    russian: "смеяться",
    level: "A2",
    forms: [
      "lache",
      "lachst",
      "lacht",
      "lacht",
      "lacht",
      "lachen",
      "lacht",
      "lachen",
      "lachen",
    ],
  },
  {
    infinitive: "laufen",
    russian: "бежать",
    level: "A2",
    forms: [
      "laufe",
      "läufst",
      "läuft",
      "läuft",
      "läuft",
      "laufen",
      "lauft",
      "laufen",
      "laufen",
    ],
  },
  {
    infinitive: "reisen",
    russian: "путешествовать",
    level: "A2",
    forms: [
      "reise",
      "reist",
      "reist",
      "reist",
      "reist",
      "reisen",
      "reist",
      "reisen",
      "reisen",
    ],
  },
  {
    infinitive: "reservieren",
    russian: "резервировать",
    level: "A2",
    forms: [
      "reserviere",
      "reservierst",
      "reserviert",
      "reserviert",
      "reserviert",
      "reservieren",
      "reserviert",
      "reservieren",
      "reservieren",
    ],
  },
  {
    infinitive: "vergessen",
    russian: "забывать",
    level: "A2",
    forms: [
      "vergesse",
      "vergisst",
      "vergisst",
      "vergisst",
      "vergisst",
      "vergessen",
      "vergesst",
      "vergessen",
      "vergessen",
    ],
  },
  {
    infinitive: "verlieren",
    russian: "терять",
    level: "A2",
    forms: [
      "verliere",
      "verlierst",
      "verliert",
      "verliert",
      "verliert",
      "verlieren",
      "verliert",
      "verlieren",
      "verlieren",
    ],
  },
  {
    infinitive: "verstehen",
    russian: "понимать",
    level: "A2",
    forms: [
      "verstehe",
      "verstehst",
      "versteht",
      "versteht",
      "versteht",
      "verstehen",
      "versteht",
      "verstehen",
      "verstehen",
    ],
  },
  {
    infinitive: "vorbereiten",
    russian: "готовиться",
    level: "A2",
    forms: [
      "bereite vor",
      "bereitest vor",
      "bereitet vor",
      "bereitet vor",
      "bereitet vor",
      "bereiten vor",
      "bereitet vor",
      "bereiten vor",
      "bereiten vor",
    ],
  },
  {
    infinitive: "warten",
    russian: "ждать",
    level: "A2",
    forms: [
      "warte",
      "wartest",
      "wartet",
      "wartet",
      "wartet",
      "warten",
      "wartet",
      "warten",
      "warten",
    ],
  },

  // B1
  {
    infinitive: "abhängen",
    russian: "зависеть",
    level: "B1",
    forms: [
      "hänge ab",
      "hängst ab",
      "hängt ab",
      "hängt ab",
      "hängt ab",
      "hängen ab",
      "hängt ab",
      "hängen ab",
      "hängen ab",
    ],
  },
  {
    infinitive: "anbieten",
    russian: "предлагать",
    level: "B1",
    forms: [
      "biete an",
      "bietest an",
      "bietet an",
      "bietet an",
      "bietet an",
      "bieten an",
      "bietet an",
      "bieten an",
      "bieten an",
    ],
  },
  {
    infinitive: "annehmen",
    russian: "принимать",
    level: "B1",
    forms: [
      "nehme an",
      "nimmst an",
      "nimmt an",
      "nimmt an",
      "nimmt an",
      "nehmen an",
      "nehmt an",
      "nehmen an",
      "nehmen an",
    ],
  },
  {
    infinitive: "benutzen",
    russian: "использовать",
    level: "B1",
    forms: [
      "benutze",
      "benutzt",
      "benutzt",
      "benutzt",
      "benutzt",
      "benutzen",
      "benutzt",
      "benutzen",
      "benutzen",
    ],
  },
  {
    infinitive: "beraten",
    russian: "советовать",
    level: "B1",
    forms: [
      "berate",
      "berätst",
      "berät",
      "berät",
      "berät",
      "beraten",
      "beratet",
      "beraten",
      "beraten",
    ],
  },
  {
    infinitive: "entscheiden",
    russian: "решать",
    level: "B1",
    forms: [
      "entscheide",
      "entscheidest",
      "entscheidet",
      "entscheidet",
      "entscheidet",
      "entscheiden",
      "entscheidet",
      "entscheiden",
      "entscheiden",
    ],
  },
  {
    infinitive: "erinnern",
    russian: "помнить",
    level: "B1",
    forms: [
      "erinnere",
      "erinnerst",
      "erinnert",
      "erinnert",
      "erinnert",
      "erinnern",
      "erinnert",
      "erinnern",
      "erinnern",
    ],
  },
  {
    infinitive: "erlauben",
    russian: "разрешать",
    level: "B1",
    forms: [
      "erlaube",
      "erlaubst",
      "erlaubt",
      "erlaubt",
      "erlaubt",
      "erlauben",
      "erlaubt",
      "erlauben",
      "erlauben",
    ],
  },
  {
    infinitive: "erreichen",
    russian: "достигать",
    level: "B1",
    forms: [
      "erreiche",
      "erreichst",
      "erreicht",
      "erreicht",
      "erreicht",
      "erreichen",
      "erreicht",
      "erreichen",
      "erreichen",
    ],
  },
  {
    infinitive: "empfehlen",
    russian: "рекомендовать",
    level: "B1",
    forms: [
      "empfehle",
      "empfiehlst",
      "empfiehlt",
      "empfiehlt",
      "empfiehlt",
      "empfehlen",
      "empfehlt",
      "empfehlen",
      "empfehlen",
    ],
  },
  {
    infinitive: "genießen",
    russian: "наслаждаться",
    level: "B1",
    forms: [
      "genieße",
      "genießt",
      "genießt",
      "genießt",
      "genießt",
      "genießen",
      "genießt",
      "genießen",
      "genießen",
    ],
  },
  {
    infinitive: "heiraten",
    russian: "жениться",
    level: "B1",
    forms: [
      "heirate",
      "heiratest",
      "heiratet",
      "heiratet",
      "heiratet",
      "heiraten",
      "heiratet",
      "heiraten",
      "heiraten",
    ],
  },
  {
    infinitive: "hoffen",
    russian: "надеяться",
    level: "B1",
    forms: [
      "hoffe",
      "hoffst",
      "hofft",
      "hofft",
      "hofft",
      "hoffen",
      "hofft",
      "hoffen",
      "hoffen",
    ],
  },
  {
    infinitive: "informieren",
    russian: "информировать",
    level: "B1",
    forms: [
      "informiere",
      "informierst",
      "informiert",
      "informiert",
      "informiert",
      "informieren",
      "informiert",
      "informieren",
      "informieren",
    ],
  },
  {
    infinitive: "interessieren",
    russian: "интересовать",
    level: "B1",
    forms: [
      "interessiere",
      "interessierst",
      "interessiert",
      "interessiert",
      "interessiert",
      "interessieren",
      "interessiert",
      "interessieren",
      "interessieren",
    ],
  },
  {
    infinitive: "teilnehmen",
    russian: "участвовать",
    level: "B1",
    forms: [
      "nehme teil",
      "nimmst teil",
      "nimmt teil",
      "nimmt teil",
      "nimmt teil",
      "nehmen teil",
      "nehmt teil",
      "nehmen teil",
      "nehmen teil",
    ],
  },
  {
    infinitive: "vergleichen",
    russian: "сравнивать",
    level: "B1",
    forms: [
      "vergleiche",
      "vergleichst",
      "vergleicht",
      "vergleicht",
      "vergleicht",
      "vergleichen",
      "vergleicht",
      "vergleichen",
      "vergleichen",
    ],
  },
  {
    infinitive: "versprechen",
    russian: "обещать",
    level: "B1",
    forms: [
      "verspreche",
      "versprichst",
      "verspricht",
      "verspricht",
      "verspricht",
      "versprechen",
      "versprecht",
      "versprechen",
      "versprechen",
    ],
  },
  {
    infinitive: "vorstellen",
    russian: "представлять",
    level: "B1",
    forms: [
      "stelle vor",
      "stellst vor",
      "stellt vor",
      "stellt vor",
      "stellt vor",
      "stellen vor",
      "stellt vor",
      "stellen vor",
      "stellen vor",
    ],
  },
  {
    infinitive: "wachsen",
    russian: "расти",
    level: "B1",
    forms: [
      "wachse",
      "wächst",
      "wächst",
      "wächst",
      "wächst",
      "wachsen",
      "wachst",
      "wachsen",
      "wachsen",
    ],
  },

  // B2
  {
    infinitive: "analysieren",
    russian: "анализировать",
    level: "B2",
    forms: [
      "analysiere",
      "analysierst",
      "analysiert",
      "analysiert",
      "analysiert",
      "analysieren",
      "analysiert",
      "analysieren",
      "analysieren",
    ],
  },
  {
    infinitive: "argumentieren",
    russian: "аргументировать",
    level: "B2",
    forms: [
      "argumentiere",
      "argumentierst",
      "argumentiert",
      "argumentiert",
      "argumentiert",
      "argumentieren",
      "argumentiert",
      "argumentieren",
      "argumentieren",
    ],
  },
  {
    infinitive: "behaupten",
    russian: "утверждать",
    level: "B2",
    forms: [
      "behaupte",
      "behauptest",
      "behauptet",
      "behauptet",
      "behauptet",
      "behaupten",
      "behauptet",
      "behaupten",
      "behaupten",
    ],
  },
  {
    infinitive: "beitragen",
    russian: "вносить вклад",
    level: "B2",
    forms: [
      "trage bei",
      "trägst bei",
      "trägt bei",
      "trägt bei",
      "trägt bei",
      "tragen bei",
      "tragt bei",
      "tragen bei",
      "tragen bei",
    ],
  },
  {
    infinitive: "betrachten",
    russian: "рассматривать",
    level: "B2",
    forms: [
      "betrachte",
      "betrachtest",
      "betrachtet",
      "betrachtet",
      "betrachtet",
      "betrachten",
      "betrachtet",
      "betrachten",
      "betrachten",
    ],
  },
  {
    infinitive: "beweisen",
    russian: "доказывать",
    level: "B2",
    forms: [
      "beweise",
      "beweist",
      "beweist",
      "beweist",
      "beweist",
      "beweisen",
      "beweist",
      "beweisen",
      "beweisen",
    ],
  },
  {
    infinitive: "diskutieren",
    russian: "дискутировать",
    level: "B2",
    forms: [
      "diskutiere",
      "diskutierst",
      "diskutiert",
      "diskutiert",
      "diskutiert",
      "diskutieren",
      "diskutiert",
      "diskutieren",
      "diskutieren",
    ],
  },
  {
    infinitive: "durchführen",
    russian: "проводить",
    level: "B2",
    forms: [
      "führe durch",
      "führst durch",
      "führt durch",
      "führt durch",
      "führt durch",
      "führen durch",
      "führt durch",
      "führen durch",
      "führen durch",
    ],
  },
  {
    infinitive: "erwägen",
    russian: "обдумывать",
    level: "B2",
    forms: [
      "erwäge",
      "erwägst",
      "erwägt",
      "erwägt",
      "erwägt",
      "erwägen",
      "erwägt",
      "erwägen",
      "erwägen",
    ],
  },
  {
    infinitive: "fördern",
    russian: "способствовать",
    level: "B2",
    forms: [
      "fördere",
      "förderst",
      "fördert",
      "fördert",
      "fördert",
      "fördern",
      "fördert",
      "fördern",
      "fördern",
    ],
  },
  {
    infinitive: "kritisieren",
    russian: "критиковать",
    level: "B2",
    forms: [
      "kritisiere",
      "kritisierst",
      "kritisiert",
      "kritisiert",
      "kritisiert",
      "kritisieren",
      "kritisiert",
      "kritisieren",
      "kritisieren",
    ],
  },
  {
    infinitive: "lösen",
    russian: "решать (проблему)",
    level: "B2",
    forms: [
      "löse",
      "löst",
      "löst",
      "löst",
      "löst",
      "lösen",
      "löst",
      "lösen",
      "lösen",
    ],
  },
  {
    infinitive: "schützen",
    russian: "защищать",
    level: "B2",
    forms: [
      "schütze",
      "schützt",
      "schützt",
      "schützt",
      "schützt",
      "schützen",
      "schützt",
      "schützen",
      "schützen",
    ],
  },
  {
    infinitive: "überzeugen",
    russian: "убеждать",
    level: "B2",
    forms: [
      "überzeuge",
      "überzeugst",
      "überzeugt",
      "überzeugt",
      "überzeugt",
      "überzeugen",
      "überzeugt",
      "überzeugen",
      "überzeugen",
    ],
  },
  {
    infinitive: "unterstützen",
    russian: "поддерживать",
    level: "B2",
    forms: [
      "unterstütze",
      "unterstützt",
      "unterstützt",
      "unterstützt",
      "unterstützt",
      "unterstützen",
      "unterstützt",
      "unterstützen",
      "unterstützen",
    ],
  },
  {
    infinitive: "verursachen",
    russian: "быть причиной",
    level: "B2",
    forms: [
      "verursache",
      "verursachst",
      "verursacht",
      "verursacht",
      "verursacht",
      "verursachen",
      "verursacht",
      "verursachen",
      "verursachen",
    ],
  },
  {
    infinitive: "vorschlagen",
    russian: "предлагать",
    level: "B2",
    forms: [
      "schlage vor",
      "schlägst vor",
      "schlägt vor",
      "schlägt vor",
      "schlägt vor",
      "schlagen vor",
      "schlagt vor",
      "schlagen vor",
      "schlagen vor",
    ],
  },
  {
    infinitive: "warnen",
    russian: "предупреждать",
    level: "B2",
    forms: [
      "warne",
      "warnst",
      "warnt",
      "warnt",
      "warnt",
      "warnen",
      "warnt",
      "warnen",
      "warnen",
    ],
  },
  {
    infinitive: "zweifeln",
    russian: "сомневаться",
    level: "B2",
    forms: [
      "zweifle",
      "zweifelst",
      "zweifelt",
      "zweifelt",
      "zweifelt",
      "zweifeln",
      "zweifelt",
      "zweifeln",
      "zweifeln",
    ],
  },
];

const LEVEL_ORDER = ["A1", "A2", "B1", "B2"];
const LEVEL_UP_REQUIREMENTS = {
  correctAnswers: 25,
  accuracy: 0.8,
};

// --- HELPER COMPONENTS ---
const GeminiInfoModal = ({
  show,
  onClose,
  verb,
  onFetch,
  speak,
  isSpeaking,
}) => {
  // This component is simplified as it's not the main focus of the changes
  const [geminiInfo, setGeminiInfo] = useState({
    loading: false,
    data: null,
    error: null,
  });

  const handleFetch = useCallback(() => {
    onFetch(verb, setGeminiInfo);
  }, [verb, onFetch]);

  useEffect(() => {
    if (show && !geminiInfo.data && !geminiInfo.loading) {
      handleFetch();
    }
  }, [show, geminiInfo, handleFetch]);

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-purple-500" />
          {verb.infinitive}
        </h3>
        {geminiInfo.loading && (
          <div className="flex justify-center items-center h-48">
            <LoaderCircle className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        )}
        {geminiInfo.error && (
          <div className="text-red-500 bg-red-50 p-3 rounded-lg">
            {geminiInfo.error}
          </div>
        )}
        {geminiInfo.data && (
          <div className="space-y-4">
            {geminiInfo.data.verb_type && (
              <div>
                <h4 className="font-semibold text-lg">Тип глагола:</h4>
                <p className="p-2 bg-indigo-50 rounded-lg">
                  {geminiInfo.data.verb_type}
                </p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-lg">Примеры:</h4>
              <ul className="space-y-2">
                {geminiInfo.data.examples.map((ex, i) => (
                  <li key={i} className="p-2 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p>{ex.german}</p>
                      <button
                        onClick={() => speak(ex.german)}
                        disabled={isSpeaking}
                        className="p-1"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm italic text-gray-500">{ex.russian}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg">Интересный факт:</h4>
              <p className="p-2 bg-blue-50 rounded-lg">
                {geminiInfo.data.fact}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LevelUpToast = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div className="fixed top-5 right-5 bg-green-500 text-white p-4 rounded-lg shadow-lg z-[100] flex items-center animate-bounce">
      <Unlock className="w-6 h-6 mr-3" />
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-4 text-xl font-bold">
        &times;
      </button>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const GermanVerbsApp = () => {
  // --- STATE ---
  const [unlockedLevels, setUnlockedLevels] = useState(["A1"]);
  const [levelProgress, setLevelProgress] = useState(() => {
    const progress = {};
    LEVEL_ORDER.forEach((level) => {
      progress[level] = { correct: 0, total: 0, uniqueVerbs: new Set() };
    });
    return progress;
  });
  const [currentVerbIndex, setCurrentVerbIndex] = useState(0);
  const [practiceMode, setPracticeMode] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [currentPronoun, setCurrentPronoun] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [correctlyAnsweredIndices, setCorrectlyAnsweredIndices] = useState(
    new Set()
  );
  const [levelUpMessage, setLevelUpMessage] = useState("");

  // --- DERIVED STATE & MEMOS ---
  const availableVerbs = useMemo(() => {
    return allVerbs.filter((verb) => unlockedLevels.includes(verb.level));
  }, [unlockedLevels]);

  const currentVerb = availableVerbs[currentVerbIndex];
  const currentLevel = unlockedLevels[unlockedLevels.length - 1];

  // --- API & AUDIO ---
  const speak = useCallback(
    (text, lang = "de-DE") => {
      if (!audioReady || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [audioReady]
  );

  const fetchGeminiInfo = useCallback(async (verb, setter) => {
    setter({ loading: true, data: null, error: null });
    const prompt = `Для немецкого глагола '${verb.infinitive}' (${verb.russian}): 1. Укажи его тип (слабый, сильный или смешанный). 2. Создай 3 простых примера предложений в настоящем времени. Для каждого предложения предоставь перевод на русский. 3. Добавь один интересный факт об этом глаголе на русском языке. Ответ дай в формате JSON, соответствующем этой схеме: { "type": "object", "properties": { "verb_type": { "type": "string" }, "examples": { "type": "array", "items": { "type": "object", "properties": { "german": { "type": "string" }, "russian": { "type": "string" } } } }, "fact": { "type": "string" } } }`;
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    };
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const result = await response.json();
      const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
      setter({ loading: false, data: parsedJson, error: null });
    } catch (error) {
      setter({ loading: false, data: null, error: error.message });
    }
  }, []);

  // --- LOGIC ---
  const checkLevelUp = useCallback(
    (level) => {
      const progress = levelProgress[level];
      const nextLevelIndex = LEVEL_ORDER.indexOf(level) + 1;
      if (nextLevelIndex >= LEVEL_ORDER.length) return; // No more levels

      const nextLevel = LEVEL_ORDER[nextLevelIndex];
      if (unlockedLevels.includes(nextLevel)) return; // Already unlocked

      const accuracy =
        progress.total > 0 ? progress.correct / progress.total : 0;
      if (
        progress.uniqueVerbs.size >= LEVEL_UP_REQUIREMENTS.correctAnswers &&
        accuracy >= LEVEL_UP_REQUIREMENTS.accuracy
      ) {
        setUnlockedLevels((prev) => [...prev, nextLevel]);
        setLevelUpMessage(`Поздравляем! Вы открыли уровень ${nextLevel}!`);
        setTimeout(() => setLevelUpMessage(""), 5000);
      }
    },
    [levelProgress, unlockedLevels]
  );

  const checkAnswer = () => {
    const correctAnswer = currentVerb.forms[currentPronoun];
    const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer;

    if (isCorrect) {
      setFeedback("Правильно! ✓");
      speakFullPhrase(currentPronoun);
      setCorrectlyAnsweredIndices((prev) => new Set(prev).add(currentPronoun));

      // Update level progress
      const verbLevel = currentVerb.level;
      setLevelProgress((prev) => {
        const newProgress = { ...prev };
        newProgress[verbLevel].correct += 1;
        newProgress[verbLevel].total += 1;
        newProgress[verbLevel].uniqueVerbs.add(currentVerb.infinitive);
        checkLevelUp(verbLevel);
        return newProgress;
      });

      setTimeout(() => {
        setFeedback("");
        const nextPronounIndex = (currentPronoun + 1) % pronouns.length;
        setCurrentPronoun(nextPronounIndex);
        setUserAnswer("");
      }, 1500);
    } else {
      setFeedback(`Неверно. Правильный ответ: ${correctAnswer}`);
      const verbLevel = currentVerb.level;
      setLevelProgress((prev) => {
        const newProgress = { ...prev };
        newProgress[verbLevel].total += 1;
        newProgress[verbLevel].uniqueVerbs.add(currentVerb.infinitive);
        checkLevelUp(verbLevel);
        return newProgress;
      });
    }
  };

  const changeVerb = (direction) => {
    const newIndex =
      (currentVerbIndex + direction + availableVerbs.length) %
      availableVerbs.length;
    setCurrentVerbIndex(newIndex);
    setUserAnswer("");
    setFeedback("");
    setCurrentPronoun(0);
    setCorrectlyAnsweredIndices(new Set());
    if (autoPlay) {
      setTimeout(() => speak(availableVerbs[newIndex].infinitive), 100);
    }
  };

  const speakFullPhrase = (pronounIndex) => {
    const pronoun = pronouns[pronounIndex].german;
    const verbForm = currentVerb.forms[pronounIndex];
    speak(`${pronoun} ${verbForm}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && userAnswer.trim()) checkAnswer();
  };

  // --- RENDER ---
  if (!audioReady) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center z-[100]">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md mx-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Тренажер немецких глаголов
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Нажмите, чтобы начать и активировать звук.
          </p>
          <button
            onClick={() => setAudioReady(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl text-xl font-semibold hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-lg"
          >
            Начать
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <LevelUpToast
        message={levelUpMessage}
        onDismiss={() => setLevelUpMessage("")}
      />
      <GeminiInfoModal
        show={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
        verb={currentVerb}
        onFetch={fetchGeminiInfo}
        speak={speak}
        isSpeaking={isSpeaking}
      />
      <div className="max-w-4xl mx-auto p-0 sm:p-0 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen font-sans">
        <div className="bg-white rounded-none sm:rounded-xl shadow-xl p-2 sm:p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Уровень {currentLevel}
            </h1>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Настройки"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Настройки</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Автоозвучивание</span>
                  <button
                    onClick={() => setAutoPlay(!autoPlay)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
                      autoPlay ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    {autoPlay ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                    <span>{autoPlay ? "Вкл" : "Выкл"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setPracticeMode(false)}
                className={`px-4 py-2 rounded-md text-sm ${
                  !practiceMode
                    ? "bg-blue-500 text-white shadow"
                    : "hover:bg-gray-200"
                }`}
              >
                Изучение
              </button>
              <button
                onClick={() => setPracticeMode(true)}
                className={`px-4 py-2 rounded-md text-sm ${
                  practiceMode
                    ? "bg-green-500 text-white shadow"
                    : "hover:bg-gray-200"
                }`}
              >
                Практика
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => changeVerb(-1)}
              className="p-3 bg-gray-200 rounded-full hover:bg-gray-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center flex-1 mx-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <button
                  onClick={() => speak(currentVerb.infinitive)}
                  disabled={isSpeaking}
                  className="p-1 text-blue-500 disabled:opacity-50"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {currentVerb.infinitive}
                </h2>
                <button
                  onClick={() => setShowGeminiModal(true)}
                  className="p-1 text-purple-500 disabled:opacity-50"
                  title="Узнать больше"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 text-sm">{currentVerb.russian}</p>
              <p className="text-xs text-gray-500">
                {currentVerbIndex + 1} / {availableVerbs.length}
              </p>
            </div>
            <button
              onClick={() => changeVerb(1)}
              className="p-3 bg-gray-200 rounded-full hover:bg-gray-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-0 sm:p-0 mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {pronouns.map((pronoun, index) => (
                    <tr
                      key={index}
                      className={`hover:bg-blue-50 ${
                        practiceMode && currentPronoun === index
                          ? "bg-yellow-100"
                          : ""
                      }`}
                    >
                      <td className="border border-gray-300 p-2 text-center w-12">
                        {!practiceMode && (
                          <button
                            onClick={() => speakFullPhrase(index)}
                            disabled={isSpeaking}
                            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50"
                          >
                            <Volume2 className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 font-medium">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm sm:text-base">
                            {pronoun.german}
                          </span>
                          <span className="text-xs text-gray-500 hidden sm:inline">
                            ({pronoun.russian})
                          </span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 font-bold text-blue-600">
                        <div className="flex items-center space-x-2">
                          <span
                            className={
                              correctlyAnsweredIndices.has(index)
                                ? "text-green-600"
                                : ""
                            }
                          >
                            {practiceMode
                              ? correctlyAnsweredIndices.has(index)
                                ? currentVerb.forms[index]
                                : "???"
                              : currentVerb.forms[index]}
                          </span>
                          {!practiceMode && (
                            <button
                              onClick={() => speak(currentVerb.forms[index])}
                              disabled={isSpeaking}
                              className="p-1 text-gray-400 hover:text-blue-500 disabled:opacity-50"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {practiceMode && (
            <div className="bg-green-50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-green-800">
                  Режим практики
                </h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Счет: {levelProgress[currentVerb.level]?.correct || 0}/
                    {levelProgress[currentVerb.level]?.total || 0}
                  </span>
                </div>
              </div>
              <div className="text-center mb-4">
                <p className="text-base sm:text-lg mb-2">
                  Как спрягается <strong>{currentVerb.infinitive}</strong> с
                  местоимением{" "}
                  <strong>{pronouns[currentPronoun].german}</strong>?
                </p>
              </div>
              <div className="flex justify-center items-center space-x-2 flex-wrap">
                <span className="text-lg sm:text-xl font-bold">
                  {pronouns[currentPronoun].german}
                </span>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="px-3 py-2 border border-gray-300 rounded-lg w-32 sm:w-auto"
                  placeholder="Форма глагола"
                  autoFocus
                />
                <button
                  onClick={checkAnswer}
                  disabled={!userAnswer.trim()}
                  className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
              {feedback && (
                <div
                  className={`text-center p-3 mt-4 rounded-lg ${
                    feedback.includes("Правильно")
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {feedback}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GermanVerbsApp;
