/**
 * A bank of sentence structure templates.
 * As mentioned in the technical specification (3.3.2).
 *
 * Placeholders:
 * - {pronoun}: A subject pronoun (e.g., "ich", "du")
 * - {verb}: A conjugated verb
 * - {complement}: A noun phrase, prepositional phrase, or other sentence component.
 * - {infinitive}: The infinitive form of a verb.
 */
export const SENTENCE_TEMPLATES = {
  // --- BEGINNER ---
  statement_present: [
    "{pronoun} {verb} {complement}.",
    "{pronoun} {verb} gern {complement}.",
    "{pronoun} {verb} heute {complement}.",
  ],

  // --- INTERMEDIATE ---
  question_present: [
    "{verb} {pronoun} {complement}?",
    "Wann {verb} {pronoun} {complement}?",
  ],
  negation_present: [
    "{pronoun} {verb} {complement} nicht.",
    "{pronoun} {verb} keinen {complement}.",
  ],
  statement_perfekt: [
    "{pronoun} haben {complement} {partizip_ii}.",
    "{pronoun} sein {complement} {partizip_ii}.",
  ],

  // --- ADVANCED ---
  modal_present: [
    "{pronoun} {modal_verb} {complement} {infinitive}.",
  ],
  subordinate_clause: [
    "Ich denke, dass {pronoun} {complement} {verb}.",
  ],
};
