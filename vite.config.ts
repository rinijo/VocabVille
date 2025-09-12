// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";   // or "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths";
import tailwind from "@tailwindcss/vite";

// ⬅️ set to your repo name (Project Pages) or "/" (user/org page)
const BASE = "/VocabVille/";

export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwind()],
  base: BASE,
});
