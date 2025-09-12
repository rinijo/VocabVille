const INV_KEY = "vocabville:inventory";

type Bag = Record<string, number>; // itemId -> count
type Inventory = Record<string, Bag>; // scope -> bag

function scopeKey(dimension: string, biome: string) {
  return `${dimension}/${biome}`;
}

export function getInventory(dimension: string, biome: string): Bag {
  try {
    const raw = localStorage.getItem(INV_KEY);
    const inv: Inventory = raw ? JSON.parse(raw) : {};
    return inv[scopeKey(dimension, biome)] ?? {};
  } catch {
    return {};
  }
}

export function addItem(dimension: string, biome: string, itemId: string, qty = 1) {
  const raw = localStorage.getItem(INV_KEY);
  const inv: Inventory = raw ? JSON.parse(raw) : {};
  const scope = scopeKey(dimension, biome);
  inv[scope] = inv[scope] ?? {};
  inv[scope][itemId] = (inv[scope][itemId] ?? 0) + qty;
  localStorage.setItem(INV_KEY, JSON.stringify(inv));
}

export function countItem(dimension: string, biome: string, itemId: string): number {
  return getInventory(dimension, biome)[itemId] ?? 0;
}
