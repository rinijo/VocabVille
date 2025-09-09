import * as React from "react";
import { OVERWORLD_CATEGORIES } from "../data/overworld";
import BiomeNode from "./BiomeNode";
import { ensureDefaults, isUnlocked } from "../utils/progress";

export default function BiomeMapOverworld() {
  React.useEffect(() => {
    ensureDefaults();
  }, []);

  return (
    <div className="map-wrap">
      <h2 className="map-title">Overworld Map</h2>

      <div className="map-grid">
        {OVERWORLD_CATEGORIES.map((cat) => (
          <section key={cat.key} className="cat-card">
            <header className="cat-header">
              <span className={`badge badge--overworld`}>{cat.name}</span>
            </header>

            <div className="biome-grid">
              {cat.biomes.map((b) => {
                const unlocked = isUnlocked("overworld", b.slug);
                const to = unlocked ? `/study/overworld/${b.slug}` : undefined;
                return (
                  <BiomeNode
                    key={b.slug}
                    to={to}
                    locked={!unlocked}
                    label={b.name}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
