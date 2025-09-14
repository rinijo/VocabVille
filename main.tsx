// main.tsx (drop-in replacement)
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./react-router.config";
import "./styles.css";

// --- FIRST-RUN DEFAULTS: ensure Plains is unlocked immediately ---
(() => {
  try {
    const FIRST_RUN_KEY = "vocabville:firstRun:v1";
    if (!localStorage.getItem(FIRST_RUN_KEY)) {
      // 1) Seed the per-biome study status key your study page uses:
      //    vocabville:study:status:<dimension>:<biome>
      const PLAINS_STATUS_KEY = "vocabville:study:status:overworld:plains";
      if (!localStorage.getItem(PLAINS_STATUS_KEY)) {
        // Minimal object; many UIs only check key existence/truthiness
        localStorage.setItem(PLAINS_STATUS_KEY, JSON.stringify({ unlocked: true }));
      }

      // 2) Seed/merge a central unlocks map in case your Overworld grid uses it
      //    vocabville:biome:unlocks  ->  { overworld: { plains: true, ... } }
      const UNLOCKS_KEY = "vocabville:biome:unlocks";
      const existing = (() => {
        try {
          const raw = localStorage.getItem(UNLOCKS_KEY);
          return raw ? JSON.parse(raw) : {};
        } catch {
          return {};
        }
      })();

      const merged = {
        ...existing,
        overworld: {
          ...(existing.overworld ?? {}),
          plains: true,
        },
      };
      localStorage.setItem(UNLOCKS_KEY, JSON.stringify(merged));

      // Mark first-run seeded
      localStorage.setItem(FIRST_RUN_KEY, "done");
    }
  } catch {
    // ignore (e.g., private mode)
  }
})();

// Keep basename for GitHub Pages subpath
const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
