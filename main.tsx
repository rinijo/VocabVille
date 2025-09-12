// main.tsx (at repo root)
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./react-router.config";      // you already have this file
import "./styles.css";                           // you already have this file

// Use the same base as vite.config.ts so GitHub Pages subpath works
const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
