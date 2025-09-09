// app/utils/progress.ts
const KEY = "vocabville:unlocked";

export function getUnlocked(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function saveUnlocked(set: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
}

/** Ensure at least the first Overworld biome is unlocked on first run */
export function ensureDefaults() {
  const set = getUnlocked();
  if (!set.has("overworld/plains")) {
    set.add("overworld/plains");
    saveUnlocked(set);
  }
}

export function isUnlocked(dimension: string, slug: string) {
  return getUnlocked().has(`${dimension}/${slug}`);
}

export function unlock(dimension: string, slug: string) {
  const set = getUnlocked();
  set.add(`${dimension}/${slug}`);
  saveUnlocked(set);
}
