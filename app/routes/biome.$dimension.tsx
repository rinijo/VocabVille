// app/routes/biome.$dimension.tsx
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import BiomeMapOverworld from "../components/BiomeMap";

type DimensionKey = "overworld" | "nether" | "the-end";
const BASE = import.meta.env.BASE_URL;

const DIMENSIONS: Record<
  DimensionKey,
  { label: string; badgeClass: string; bg: string; blurb: string }
> = {
  overworld: {
    label: "Overworld",
    badgeClass: "badge badge--overworld",
    bg: `${BASE}images/home-bg.jpg`,
    blurb: "Pick a biome to start learning. Unlock more biomes as you master words!",
  },
  nether: {
    label: "The Nether",
    badgeClass: "badge badge--nether",
    bg: `${BASE}images/home-bg.jpg`,
    blurb: "Locked for now.",
  },
  "the-end": {
    label: "The End",
    badgeClass: "badge badge--theend",
    bg: `${BASE}images/home-bg.jpg`,
    blurb: "Locked for now.",
  },
};

// --- Helpers to guarantee first-run unlock of OVW/Plains ---
const UNLOCKS_KEY = "vocabville:biome:unlocks"; // { [dimension]: { [biome]: true } }
const PLAINS_STATUS_KEY = "vocabville:study:status:overworld:plains"; // per-biome study key

function seedOverworldPlainsUnlocked() {
  try {
    // 1) If your map checks a central unlocks object, ensure plains=true
    const existingUnlocksRaw = localStorage.getItem(UNLOCKS_KEY);
    const existingUnlocks = existingUnlocksRaw ? JSON.parse(existingUnlocksRaw) : {};
    const merged = {
      ...existingUnlocks,
      overworld: {
        ...(existingUnlocks?.overworld ?? {}),
        plains: true, // ✅ default unlocked
      },
    };
    // Only write if changed (avoid thrashing)
    if (JSON.stringify(merged) !== existingUnlocksRaw) {
      localStorage.setItem(UNLOCKS_KEY, JSON.stringify(merged));
    }

    // 2) If your UI checks the per-biome study status key, ensure it exists
    if (!localStorage.getItem(PLAINS_STATUS_KEY)) {
      localStorage.setItem(PLAINS_STATUS_KEY, JSON.stringify({ unlocked: true, __seeded: true }));
    }
  } catch {
    // Ignore storage errors (e.g., private mode)
  }
}

export default function BiomePage() {
  const { dimension: dimParam = "" } = useParams();
  const dimension = dimParam.toLowerCase() as DimensionKey;
  const config = DIMENSIONS[dimension];

  if (!config) {
    return (
      <main className="center-wrap">
        <div className="stack">
          <h1 className="h1">Dimension not found</h1>
          <Link className="mc-btn" to="/">Back to Home</Link>
        </div>
      </main>
    );
  }

  // ✅ Ensure Plains is unlocked BEFORE the map component renders
  if (dimension === "overworld") {
    // This runs during parent render, so child <BiomeMapOverworld /> sees the keys immediately.
    seedOverworldPlainsUnlocked();
  }

  return (
    <main className="hero" style={{ backgroundImage: `url(${config.bg})` }}>
      {/* TOP-RIGHT NAV */}
      <nav className="top-right-nav">
        <Link className="mc-btn" to="/">Back to Home</Link>
      </nav>

      <div className="center-wrap">
        <div className="stack">
          <span className={config.badgeClass}>{config.label}</span>

          <div className="card">
            <h2>{config.label} Biome</h2>
            <p style={{ lineHeight: 1.6 }}>{config.blurb}</p>

            {dimension === "overworld" ? (
              <BiomeMapOverworld />
            ) : (
              <div style={{ display: "grid", gap: ".5rem", marginTop: "1rem" }}>
                <div className="biome-grid">
                  <div className="biome-node locked" aria-disabled="true">
                    <span className="biome-emoji">🔒</span>
                    <span className="biome-label">Coming soon</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
