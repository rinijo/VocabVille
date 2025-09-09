// app/data/overworld.ts
export type Biome = {
  slug: string;
  name: string;
  note?: string;
};

export type Category = {
  key: string;
  name: string;
  biomes: Biome[];
};

export const OVERWORLD_CATEGORIES: Category[] = [
  {
    key: "plains",
    name: "Plains",
    biomes: [
      { slug: "plains", name: "Plains", note: "Villages, farm animals" },
      { slug: "ice-plains", name: "Ice Plains", note: "Snowy tundra" },
      { slug: "ice-spike-plains", name: "Ice Spike Plains" },
      { slug: "sunflower-plains", name: "Sunflower Plains" },
      { slug: "snowy-plains", name: "Snowy Plains" },
      { slug: "mushroom-field", name: "Mushroom Field" },
      { slug: "savanna", name: "Savanna" },
    ],
  },
  {
    key: "woodlands",
    name: "Woodlands",
    biomes: [
      { slug: "forest", name: "Forest" },
      { slug: "birch-forest", name: "Birch Forest" },
      { slug: "dark-forest", name: "Dark Forest" },
      { slug: "flower-forest", name: "Flower Forest" },
      { slug: "old-growth-birch-forest", name: "Old Growth Birch Forest" },
      { slug: "taiga", name: "Taiga" },
      { slug: "old-growth-spruce-taiga", name: "Old Growth Spruce Taiga" },
      { slug: "old-growth-pine-taiga", name: "Old Growth Pine Taiga" },
      { slug: "snowy-taiga", name: "Snowy Taiga" },
      { slug: "jungle", name: "Jungle" },
      { slug: "bamboo-jungle", name: "Bamboo Jungle" },
      { slug: "sparse-jungle", name: "Sparse Jungle" },
      { slug: "grove", name: "Grove" },
      { slug: "cherry-grove", name: "Cherry Grove" },
      { slug: "pale-garden", name: "Pale Garden" },
    ],
  },
  {
    key: "caves",
    name: "Caves",
    biomes: [
      { slug: "deep-dark", name: "Deep Dark" },
      { slug: "dripstone-caves", name: "Dripstone Caves" },
      { slug: "lush-caves", name: "Lush Caves" },
    ],
  },
  {
    key: "mountains",
    name: "Mountains",
    biomes: [
      { slug: "jagged-peaks", name: "Jagged Peaks" },
      { slug: "frozen-peaks", name: "Frozen Peaks" },
      { slug: "stony-peaks", name: "Stony Peaks" },
      { slug: "snowy-slopes", name: "Snowy Slopes" },
      { slug: "windswept-hills", name: "Windswept Hills" },
      { slug: "windswept-forest", name: "Windswept Forest" },
      { slug: "windswept-gravelly-hills", name: "Windswept Gravelly Hills" },
      { slug: "meadow", name: "Meadow" },
      { slug: "stony-shores", name: "Stony Shores" },
      { slug: "savanna-plateau", name: "Savanna Plateau" },
      { slug: "windswept-savanna", name: "Windswept Savanna" },
    ],
  },
  {
    key: "swamps",
    name: "Swamps",
    biomes: [
      { slug: "swamp", name: "Swamp" },
      { slug: "mangrove-swamp", name: "Mangrove Swamp" },
    ],
  },
  {
    key: "sandy",
    name: "Sandy Areas",
    biomes: [
      { slug: "badlands", name: "Badlands" },
      { slug: "wooded-badlands", name: "Wooded Badlands" },
      { slug: "eroded-badlands", name: "Eroded Badlands" },
      { slug: "beach", name: "Beach" },
      { slug: "snowy-beach", name: "Snowy Beach" },
      { slug: "desert", name: "Desert" },
    ],
  },
  {
    key: "water",
    name: "Water Areas",
    biomes: [
      { slug: "river", name: "River" },
      { slug: "frozen-river", name: "Frozen River" },
      { slug: "ocean", name: "Ocean" },
      { slug: "cold-ocean", name: "Cold Ocean" },
      { slug: "deep-ocean", name: "Deep Ocean" },
      { slug: "frozen-ocean", name: "Frozen Ocean" },
      { slug: "lukewarm-ocean", name: "Lukewarm Ocean" },
      { slug: "warm-ocean", name: "Warm Ocean" },
    ],
  },
];
