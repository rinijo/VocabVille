// LocalStorage helpers for study answers + progress
type Answers = {
  definition?: string;
  synonym?: string;
  antonym?: string;
  spelling?: string;
};

const KEY = "vocabville:study"; // namespaced root

function k(dimension: string, biome: string) {
  return `${KEY}:${dimension}:${biome}`;
}

export function loadAllAnswers(dimension: string, biome: string): Record<string, Answers> {
  try {
    const raw = localStorage.getItem(k(dimension, biome));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function loadAnswersForWord(
  dimension: string,
  biome: string,
  word: string
): Answers {
  const all = loadAllAnswers(dimension, biome);
  return all[word] ?? {};
}

export function saveAnswersForWord(
  dimension: string,
  biome: string,
  word: string,
  answers: Answers
) {
  const all = loadAllAnswers(dimension, biome);
  all[word] = { ...(all[word] ?? {}), ...answers };
  localStorage.setItem(k(dimension, biome), JSON.stringify(all));
}

export function countCompleted(dimension: string, biome: string): number {
  const all = loadAllAnswers(dimension, biome);
  return Object.values(all).filter(a =>
    a.definition?.trim() ||
    a.synonym?.trim() ||
    a.antonym?.trim() ||
    a.spelling?.trim()
  ).length;
}

export type { Answers };
