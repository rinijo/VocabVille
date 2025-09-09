import * as React from "react";
import {
  Link,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { OVERWORLD_CATEGORIES } from "../data/overworld";
import {
  loadAnswersForWord,
  saveAnswersForWord,
  countCompleted,
  type Answers,
} from "../utils/study";

// ---------- loader ----------
export async function loader({ params }: LoaderFunctionArgs) {
  const dimension = (params.dimension ?? "").toLowerCase();
  const biome = (params.biome ?? "").toLowerCase();

  // Only Overworld for now
  if (!dimension || !biome || dimension !== "overworld") {
    throw new Response(JSON.stringify({ message: "Unknown study path" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Find the biome name from our category data
  const allBiomes = OVERWORLD_CATEGORIES.flatMap(c => c.biomes);
  const match = allBiomes.find(b => b.slug === biome);
  const name = match?.name ?? biome.replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase());

  // Background uses a filename convention you can provide:
  // Place images at: /public/images/overworld/<slug>.jpg or .png
  const bg = `/images/overworld/${biome}.jpg`;

  // One-liner (add more specific lines below if you want)
  const BLURBS: Record<string, string> = {
    plains: "Flat grasslands with villages and friendly mobs.",
    "ice-plains": "Snowy tundra—cold, wide, and windswept.",
    "ice-spike-plains": "Towering ice spires piercing the sky.",
    "sunflower-plains": "Fields of tall sunflowers facing the sun.",
    "snowy-plains": "Snow-dusted flats with the chill of strays.",
    "mushroom-field": "Mycelium islands where mooshrooms roam.",
    savanna: "Dry grass, acacia trees, and warm horizons.",
    forest: "Oak and birch trees with life under the canopy.",
    "birch-forest": "White-barked birches in gentle woods.",
    "dark-forest": "Dense dark oaks where shadows linger.",
    "flower-forest": "A tapestry of blossoms and buzzing bees.",
    "deep-dark": "Sculk, silence…and something listening.",
    "lush-caves": "Verdant caverns of moss, azalea, and glow berries.",
    "dripstone-caves": "Stone spears above and below.",
    "jagged-peaks": "Sky-high edges glazed with snow.",
    desert: "Hot sands, cacti, and ancient secrets.",
    beach: "Where land kisses sea—and turtles nest.",
    river: "Curving waters carving through land.",
    ocean: "Waves, kelp forests, and curious fish.",
    // add more as you like
  };
  const blurb = BLURBS[biome] ?? `Explore the ${name} biome.`;

  // Word list stub (replace with your real 30 words later)
  // For now, generate 30 placeholders to wire the UI
  const words = Array.from({ length: 30 }, (_, i) => `${name} Word ${String(i + 1).padStart(2, "0")}`);

  return Response.json({ dimension, biome, name, bg, blurb, words });
}

// ---------- component ----------
export default function StudyPage() {
  const { dimension, biome, name, bg, blurb, words } = useLoaderData<typeof loader>();

  const [index, setIndex] = React.useState(0);
  const word = words[index];

  const [answers, setAnswers] = React.useState<Answers>(() =>
    loadAnswersForWord(dimension, biome, word)
  );

  // reload saved answers when the word changes
  React.useEffect(() => {
    setAnswers(loadAnswersForWord(dimension, biome, word));
  }, [dimension, biome, word]);

  // progress count for right panel
  const [doneCount, setDoneCount] = React.useState(() =>
    countCompleted(dimension, biome)
  );
  React.useEffect(() => {
    setDoneCount(countCompleted(dimension, biome));
  }, [dimension, biome, index]);

  function save() {
    saveAnswersForWord(dimension, biome, word, answers);
    setDoneCount(countCompleted(dimension, biome));
    alert("Saved! ⛏️");
  }

  function onChange<K extends keyof Answers>(key: K, value: string) {
    setAnswers(a => ({ ...a, [key]: value }));
  }

  function prev() {
    setIndex(i => (i > 0 ? i - 1 : i));
  }
  function next() {
    setIndex(i => (i < words.length - 1 ? i + 1 : i));
  }

  return (
    <main
      className="hero study-hero"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="center-wrap">
        <div className="study-grid">
          {/* MAIN */}
          <section className="study-main card">
            <header className="study-header">
              <div>
                <div className="badge badge--overworld">{name}</div>
                <h2 style={{ margin: ".25rem 0 .5rem" }}>{blurb}</h2>
              </div>
              <div className="study-nav">
                <button className="mc-btn" onClick={prev} aria-label="Previous word">◀ Prev</button>
                <div className="study-step">
                  {index + 1} / {words.length}
                </div>
                <button className="mc-btn" onClick={next} aria-label="Next word">Next ▶</button>
              </div>
            </header>

            <div className="mine-wrap">
              <h3 className="mine-title">⛏️ Mine the word</h3>
              <div className="mine-word">{word}</div>

              <div className="mine-fields">
                <label className="field">
                  <span>Definition</span>
                  <textarea
                    value={answers.definition ?? ""}
                    onChange={e => onChange("definition", e.target.value)}
                    rows={3}
                  />
                </label>

                <label className="field">
                  <span>Synonym</span>
                  <input
                    value={answers.synonym ?? ""}
                    onChange={e => onChange("synonym", e.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Antonym</span>
                  <input
                    value={answers.antonym ?? ""}
                    onChange={e => onChange("antonym", e.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Spelling</span>
                  <input
                    value={answers.spelling ?? ""}
                    onChange={e => onChange("spelling", e.target.value)}
                  />
                </label>
              </div>
            </div>
          </section>

          {/* RIGHT PANEL */}
          <aside className="study-side">
            <div className="side-card card">
              <h3 style={{ marginTop: 0 }}>🎒 Inventory Chest</h3>
              <p style={{ marginTop: ".25rem" }}>
                Mined words: <b>{doneCount}</b> / <b>{words.length}</b>
              </p>
              <div style={{ display: "grid", gap: ".5rem", marginTop: ".5rem" }}>
                <button className="mc-btn" onClick={save}>Save the Villagers</button>
                <Link className="mc-btn" to="/biome/overworld">Back to Overworld</Link>
              </div>
            </div>

            {/* <div className="side-card card">
              <h4 style={{ marginTop: 0 }}>Tips</h4>
              <ul style={{ margin: 0, paddingLeft: "1rem", lineHeight: 1.6 }}>
                <li>Type answers, then hit <i>Save the world</i>.</li>
                <li>Use Next ▶ to move to the next word.</li>
                <li>Backgrounds live at <code>/images/overworld/&lt;slug&gt;.jpg</code>.</li>
              </ul>
            </div> */}
          </aside>
        </div>

        {/* Back button for mobile view */}
        <div className="study-back-mobile">
          <Link className="mc-btn" to={`/biome/${dimension}`}>Back to {dimension}</Link>
        </div>
      </div>
    </main>
  );
}
