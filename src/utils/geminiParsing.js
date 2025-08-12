/**
 * Утилиты для жёсткого парсинга ответов Gemini и нормализации формата.
 */

export function stripCodeFence(raw) {
  if (!raw) return raw;
  let text = String(raw).trim();
  if (!text.startsWith("```") && !text.endsWith("```")) return text;
  text = text.replace(/^```json\s*/i, "");
  text = text.replace(/^```\s*/i, "");
  text = text.replace(/```$/i, "");
  return text.trim();
}

export function safeParseJSON(raw) {
  const cleaned = stripCodeFence(raw);
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch (e) {
    const err = new Error("Gemini JSON parse error");
    err.raw = raw;
    throw err;
  }
}

export function validatePhraseJson(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Invalid phrase object");
  if (typeof obj.german !== "string" || typeof obj.russian !== "string") {
    throw new Error("Phrase must have german and russian strings");
  }
  const german = obj.german.trim();
  const russian = obj.russian.trim();
  if (!german || !russian) throw new Error("Empty phrase fields");
  return { german, russian };
}

export function validateVerbInfoJson(obj) {
  if (!obj || typeof obj !== "object")
    throw new Error("Invalid verb info object");
  if (!Array.isArray(obj.examples)) throw new Error("Missing examples array");
  return obj;
}
