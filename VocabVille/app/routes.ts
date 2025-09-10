// app/routes.ts
import { index, route } from "@react-router/dev/routes";

const routes = [
  index("routes/_index.tsx"),

  route("/biome/:dimension", "routes/biome.$dimension.tsx"),
  route("/study/:dimension/:biome", "routes/study.$dimension.$biome.tsx"),

  // NEW: Quest page per biome
  route("/quest/:dimension/:biome", "routes/quest.$dimension.$biome.tsx"),
];

export default routes;
