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
