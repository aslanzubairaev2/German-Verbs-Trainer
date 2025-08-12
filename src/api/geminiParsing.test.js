import { safeParseJSON, validatePhraseJson } from "../utils/geminiParsing";

test("safeParseJSON handles fenced json", () => {
  const raw =
    '```json\n{\n "german": "Ich gehe", \n "russian": "Я иду"\n}\n```';
  const obj = safeParseJSON(raw);
  expect(obj.german).toBe("Ich gehe");
});

test("validatePhraseJson ensures required fields", () => {
  const valid = validatePhraseJson({ german: "Hallo", russian: "Привет" });
  expect(valid.german).toBe("Hallo");
});
