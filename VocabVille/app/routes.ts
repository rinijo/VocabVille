// app/routes.ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Home
  index("routes/_index.tsx"),

  // Biome dimension page (dynamic): /biome/overworld, /biome/nether, /biome/the-end
  route("/biome/:dimension", "routes/biome.$dimension.tsx"),

  // Study page for sub-biomes (dynamic): /study/overworld/plains, etc.
  route("/study/:dimension/:biome", "routes/study.$dimension.$biome.tsx"),
] satisfies RouteConfig;
