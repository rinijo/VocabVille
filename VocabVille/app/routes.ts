import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),

  // keep study dynamic so you don't need dozens of files
  route("/biome/:dimension", "routes/biome.$dimension.tsx"),
] satisfies RouteConfig;
