import React from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";

/**
 * Root layout for the SPA.
 * - Wraps all pages
 * - Provides a place for global UI (header/footer/toasts)
 * - Enables scroll restoration between navigations
 */
export default function App() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Global header (optional) */}
      {/* <header className="p-4 border-b">
        <h1 className="text-lg font-bold">Minecraft VocabVille</h1>
      </header> */}

      <main className="flex-1">
        {/* Nested routes render here */}
        <Outlet />
      </main>

      {/* Global footer (optional) */}
      {/* <footer className="p-4 border-t text-sm text-center">
        © {new Date().getFullYear()} VocabVille
      </footer> */}

      {/* Keep scroll position behavior consistent across navigations */}
      <ScrollRestoration />
    </div>
  );
}
