// app/utils/unblocks.ts
// Thin wrapper that guarantees starter unlock and re-exports helpers.

import { ensureDefaults, isUnlocked, unlock } from "./progress";

/**
 * Call this at app start (or inside routes) if you use any “unlock by rules” flows.
 * It guarantees the starter biome is seeded even if rules haven't run yet.
 */
export function ensureStarterUnlock() {
  ensureDefaults();
}

export { isUnlocked, unlock };
