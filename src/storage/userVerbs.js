const LS_KEY = "userVerbsV1";

export function loadUserVerbs() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveUserVerbs(verbs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(verbs || []));
  } catch {}
}

export function addUserVerb(verb) {
  const current = loadUserVerbs();
  const exists = current.some((v) => v.infinitive === verb.infinitive);
  const updated = exists
    ? current.map((v) => (v.infinitive === verb.infinitive ? verb : v))
    : [...current, verb];
  saveUserVerbs(updated);
  return updated;
}

export function removeUserVerb(infinitive) {
  const current = loadUserVerbs();
  const updated = current.filter((v) => v.infinitive !== infinitive);
  saveUserVerbs(updated);
  return updated;
}
