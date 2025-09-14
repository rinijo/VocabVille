// app/utils/progress.ts
// Centralised progress + unlocks utils

type Unlocks = Record<string, Record<string, boolean>>;

const UNLOCKS_KEY = "vocabville:biome:unlocks";

/* ---------- storage helpers ---------- */
function loadUnlocks(): Unlocks {
  try {
    const raw = localStorage.getItem(UNLOCKS_KEY);
    return raw ? (JSON.parse(raw) as Unlocks) : {};
  } catch {
    return {};
  }
}

function saveUnlocks(data: Unlocks) {
  try {
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify(data));
  } catch {
    /* ignore storage errors (private mode, quota, etc.) */
  }
}

/* ---------- public API ---------- */

/**
 * Ensure baseline defaults exist in storage.
 * - Seeds overworld.plains = true so subsequent renders are consistent.
 */
export function ensureDefaults() {
  const data = loadUnlocks();
  if (!data.overworld) data.overworld = {};
  if (!data.overworld.plains) {
    data.overworld.plains = true; // starter biome
    saveUnlocks(data);
  }
}

/**
 * Read-only check used by the UI.
 * - Returns true for (overworld, plains) even if storage is empty, so the
 *   very first render on a deep link never shows it as locked.
 */
export function isUnlocked(dimension: string, biome: string): boolean {
  // ✅ starter guarantee
  if (dimension === "overworld" && biome === "plains") return true;

  const data = loadUnlocks();
  return !!data?.[dimension]?.[biome];
}

/**
 * Programmatic unlock (e.g., after rules are satisfied).
 */
export function unlock(dimension: string, biome: string) {
  const data = loadUnlocks();
  if (!data[dimension]) data[dimension] = {};
  if (!data[dimension][biome]) {
    data[dimension][biome] = true;
    saveUnlocks(data);
  }
}

/**
 * (Optional) reset everything — handy for debugging.
 */
export function resetAllProgress() {
  try {
    localStorage.removeItem(UNLOCKS_KEY);
  } catch {
    /* noop */
  }
}
