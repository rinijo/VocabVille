// routes.tsx
import React from "react";

// Import your route components directly
import IndexPage from "./app/routes/_index";                // was routes/_index.tsx
import BiomePage from "./app/routes/biome.$dimension";      // was routes/biome.$dimension.tsx
import StudyPage from "./app/routes/study.$dimension.$biome"; // was routes/study.$dimension.$biome.tsx
import QuestPage from "./app/routes/quest.$dimension.$biome"; // was routes/quest.$dimension.$biome.tsx

// Export as an array of RouteObject children
const routes = [
  { index: true, element: <IndexPage /> },

  { path: "biome/:dimension", element: <BiomePage /> },
  { path: "study/:dimension/:biome", element: <StudyPage /> },

  // Quest page per biome
  { path: "quest/:dimension/:biome", element: <QuestPage /> },
];

export default routes;
