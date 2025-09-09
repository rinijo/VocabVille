// app/routes.ts
import { index, route } from "@react-router/dev/routes";

const routes = [
  // Home
  index("routes/_index.tsx"),

  // Biome dimension page (dynamic): /biome/overworld, /biome/nether, /biome/the-end
  route("/biome/:dimension", "routes/biome.$dimension.tsx"),

  // Study page for sub-biomes (dynamic): /study/overworld/plains, etc.
  route("/study/:dimension/:biome", "routes/study.$dimension.$biome.tsx"),
];

export default routes;
