import * as React from "react";
import { Link } from "react-router-dom";
import { OVERWORLD_CATEGORIES } from "../data/overworld";
import { countItem } from "../utils/inventory";

const STATUS_KEY = "vocabville:study:status";
const BASE = import.meta.env.BASE_URL;

const statusScope = (d: string, b: string) => `${STATUS_KEY}:${d}:${b}`;
const loadAllStatus = (d: string, b: string) => {
  try {
    const raw = localStorage.getItem(statusScope(d, b));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export default function StatsPage() {
  const [stats, setStats] = React.useState<{
    totalWords: number;
    completedOnce: number;
    mastered: number;
    craftingTables: number;
  }>({ totalWords: 0, completedOnce: 0, mastered: 0, craftingTables: 0 });

  React.useEffect(() => {
    let totalWords = 0;
    let completedOnce = 0;
    let mastered = 0;
    let craftingTables = 0;

    for (const cat of OVERWORLD_CATEGORIES) {
      for (const biome of cat.biomes) {
        const map = loadAllStatus("overworld", biome.slug);
        const terms = Object.keys(map);
        totalWords += terms.length;
        completedOnce += terms.filter((t) => map[t].answeredCorrectOnce).length;
        mastered += terms.filter((t) => map[t].mastered).length;

        craftingTables += countItem("overworld", biome.slug, "crafting_table");
      }
    }

    setStats({ totalWords, completedOnce, mastered, craftingTables });
  }, []);

  const bg = `${BASE}images/home-bg.jpg`;

  return (
    <main
      className="hero min-h-dvh bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="center-wrap">
        <div className="stack">
          <h1 className="h1">📊 Your Stats</h1>

          <div
            className="card"
            style={{
              padding: "1.5rem",
              textAlign: "left",
              fontFamily: "'Press Start 2P', system-ui, sans-serif",
              fontSize: "14px",
              lineHeight: "1.8",
            }}
          >
            <p>Total Words Seen: <b>{stats.totalWords}</b></p>
            <p>Completed Once: <b>{stats.completedOnce}</b></p>
            <p>Mastered Words: <b>{stats.mastered}</b></p>
            <p>Crafting Tables Collected: <b>{stats.craftingTables}</b></p>
          </div>

          <Link className="mc-btn" to="/">
            ⬅ Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
