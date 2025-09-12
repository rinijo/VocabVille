import * as React from "react";
import { Link, useParams } from "react-router-dom";
import CreeperBg from "../components/CreeperBg";

type QuestConfig = { title: string; intro: string; steps: string[]; reward?: string; bg?: string; };
const BASE = import.meta.env.BASE_URL;

const TITLECASE = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

const QUESTS: Record<string, QuestConfig> = {
  plains: {
    title: "Plains Rescue",
    intro: "Raiders are scaring the villagers away from their fields. Use your word power to restore calm!",
    steps: [
      "Talk to the village elder near the windmill.",
      "Solve 3 synonym puzzles to earn trust.",
      "Find the lost sign and replace it with the correct word.",
      "Calm the crowd by explaining a tricky definition.",
      "Ring the bell to announce the village is safe."
    ],
    reward: "Village Banner (Plains)",
    bg: `${BASE}images/overworld/plains-quest-bg.png`
  },
  woodlands: {
    title: "Whispering Woods",
    intro: "Something in the woodlands is confusing travelers. Clear the signs and guide them safely.",
    steps: [
      "Meet the ranger at the forest edge.",
      "Match antonyms to open the wooden gate.",
      "Collect 5 ‘symbol’ runes hidden among birches.",
      "Speak to the shy librarian in the cabin.",
      "Light the beacon to guide everyone home."
    ],
    reward: "Oak Crest (Woodlands)"
  }
};

export default function QuestPage() {
  const { dimension = "", biome = "" } = useParams();

  if (!dimension || !biome) {
    return (
      <main className="center-wrap">
        <div className="stack">
          <h1 className="h1">Unknown quest path</h1>
          <Link className="mc-btn" to="/">Back to Home</Link>
        </div>
      </main>
    );
  }

  const quest = QUESTS[biome] ?? {
    title: `${TITLECASE(biome)} Quest`,
    intro: `A new challenge awaits in the ${TITLECASE(biome)} biome.`,
    steps: [
      "Meet the local guide.",
      "Solve a synonym riddle.",
      "Solve an antonym riddle.",
      "Place the correct word on the signpost.",
      "Report back to the guide."
    ],
    reward: `${TITLECASE(biome)} Emblem`
  };

  const name = TITLECASE(biome);
  const bg = quest.bg ?? `${BASE}images/overworld/${biome}.jpg`;
  const [checked, setChecked] = React.useState<boolean[]>(() => quest.steps.map(() => false));
  const allDone = checked.every(Boolean);
  const toggle = (i: number) => setChecked(prev => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <main className="hero" style={{ backgroundImage: `url(${bg})`, position: "relative" }}>
      {/* BACKGROUND creeper (under everything) */}
      <CreeperBg duration="6s" />

      {/* Top-right nav (above background) */}
      <nav className="top-right-nav" style={{ zIndex: 2 }}>
        <Link className="mc-btn" to={`/study/${dimension}/${biome}`}>Back to Study</Link>
        <Link className="mc-btn" to={`/biome/${dimension}`}>Overworld</Link>
      </nav>

      {/* Content */}
      <div className="center-wrap" style={{ position: "relative", zIndex: 1 }}>
        <section className="card" style={{ maxWidth: 900 }}>
          <div className="badge badge--overworld">{name} Quest</div>
          <h2 style={{ marginTop: ".5rem" }}>{quest.title}</h2>
          <p style={{ lineHeight: 1.6 }}>{quest.intro}</p>

          <ol style={{ marginTop: ".75rem", lineHeight: 1.8, paddingLeft: "1.25rem" }}>
            {quest.steps.map((step, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".35rem" }}>
                <input type="checkbox" checked={checked[i]} onChange={() => toggle(i)} aria-label={`Step ${i + 1}`} />
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div style={{ display: "grid", gap: ".5rem", marginTop: "1rem" }}>
            <button
              className="mc-btn"
              onClick={() => alert(allDone ? "Quest complete! 🎉" : "Keep going—finish all steps.")}
            >
              {allDone ? "Complete Quest" : "I’m on it!"}
            </button>
            {quest.reward ? (
              <div className="card" style={{ background: "#1b1b1baa" }}>
                Reward hint: <b>{quest.reward}</b>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
