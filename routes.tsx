// routes.tsx
import React from "react";

// Import your route components directly
import IndexPage from "./app/routes/_index";                   // home
import BiomePage from "./app/routes/biome.$dimension";         // biome page
import StudyPage from "./app/routes/study.$dimension.$biome";  // study page
import QuestPage from "./app/routes/quest.$dimension.$biome";  // quest page
import StatsPage from "./app/routes/stats";                    // NEW: stats page

// Export as an array of RouteObject children
const routes = [
  { index: true, element: <IndexPage /> },

  { path: "biome/:dimension", element: <BiomePage /> },
  { path: "study/:dimension/:biome", element: <StudyPage /> },

  // Quest page per biome
  { path: "quest/:dimension/:biome", element: <QuestPage /> },

  // Stats page
  { path: "stats", element: <StatsPage /> }, // NEW
];

export default routes;
