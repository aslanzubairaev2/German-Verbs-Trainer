/**
 * A list of German pronouns with their Russian translations.
 * As specified in the technical specification (4.1).
 */
export const PRONOUNS = [
  { german: "ich", russian: "я", base: "ich" },
  { german: "du", russian: "ты", base: "du" },
  { german: "er/sie/es", russian: "он/она/оно", base: "er" },
  { german: "wir", russian: "мы", base: "wir" },
  { german: "ihr", russian: "вы (мн.ч.)", base: "ihr" },
  { german: "sie/Sie", russian: "они/Вы", base: "sie" },
];

/**
 * A more detailed list of pronouns for advanced generation,
 * including different cases.
 */
export const PRONOUN_DETAILS = {
  ich: { nominativ: 'ich', akkusativ: 'mich', dativ: 'mir' },
  du: { nominativ: 'du', akkusativ: 'dich', dativ: 'dir' },
  er: { nominativ: 'er', akkusativ: 'ihn', dativ: 'ihm' },
  sie: { nominativ: 'sie', akkusativ: 'sie', dativ: 'ihr' },
  es: { nominativ: 'es', akkusativ: 'es', dativ: 'ihm' },
  wir: { nominativ: 'wir', akkusativ: 'uns', dativ: 'uns' },
  ihr: { nominativ: 'ihr', akkusativ: 'euch', dativ: 'euch' },
  'sie/Sie': { nominativ: 'sie/Sie', akkusativ: 'sie/Sie', dativ: 'ihnen/Ihnen' },
};
