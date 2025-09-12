// app/routes/study.$dimension.$biome.tsx
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { OVERWORLD_CATEGORIES } from "../data/overworld";
import { addItem, countItem } from "../utils/inventory";

type MCQ = { correct: string; options: string[] };
type WordCard = {
  term: string;
  definition: string;
  synonyms: MCQ;
  antonyms: MCQ;
};
type WordStatus = {
  answeredCorrectOnce?: boolean;
  masteryStreak?: number;
  mastered?: boolean;
  totalFlips?: number;
  lastResult?: "success" | "fail";
};

const STATUS_KEY = "vocabville:study:status";
const BASE = import.meta.env.BASE_URL;

const titleCase = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase());
const statusScope = (d: string, b: string) => `${STATUS_KEY}:${d}:${b}`;
const loadAllStatus = (d: string, b: string): Record<string, WordStatus> => {
  try {
    const raw = localStorage.getItem(statusScope(d, b));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const saveAllStatus = (d: string, b: string, map: Record<string, WordStatus>) => {
  localStorage.setItem(statusScope(d, b), JSON.stringify(map));
};

export default function StudyPage() {
  // ───────────────────────────────── params/state (always called in same order)
  const { dimension = "", biome = "" } = useParams();
  const dim = dimension.toLowerCase();
  const pathIsValid = dim === "overworld" && !!biome;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [words, setWords] = React.useState<WordCard[]>([]);
  const [name, setName] = React.useState(titleCase(biome));
  const [blurb, setBlurb] = React.useState("");

  const statusInitial = React.useMemo(() => loadAllStatus(dimension, biome), [dimension, biome]);

  const active = React.useMemo(
    () => words.filter(w => !statusInitial[w.term]?.mastered),
    [words, statusInitial]
  );
  const pool = active.length ? active : words;

  const [idx, setIdx] = React.useState(0);
  const current = pool[idx];

  const [flipped, setFlipped] = React.useState(false);
  const [synPick, setSynPick] = React.useState<string | null>(null);
  const [antPick, setAntPick] = React.useState<string | null>(null);
  const [synLocked, setSynLocked] = React.useState(false);
  const [antLocked, setAntLocked] = React.useState(false);

  // ───────────────────────────────── effects (never inside conditionals)
  React.useEffect(() => {
    // derive nice names/blurb from data
    const allBiomes = OVERWORLD_CATEGORIES.flatMap(c => c.biomes);
    const match = allBiomes.find(b => b.slug === biome);
    setName(match?.name ?? titleCase(biome));
    setBlurb(
      ({ plains: "Flat grasslands with villages and friendly mobs." } as Record<string, string>)[biome] ??
      `Explore the ${match?.name ?? titleCase(biome)} biome.`
    );
  }, [biome]);

  React.useEffect(() => {
    // fetch words for valid paths only; otherwise mark error
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (!pathIsValid) {
          throw new Error("Unknown study path.");
        }
        const res = await fetch(`${BASE}words/overworld/${biome}.json`, { cache: "no-store" });
        if (!res.ok) throw new Error("Words not found for this biome.");
        const raw: WordCard[] = await res.json();
        const normalized: WordCard[] = raw.map(w => ({
          term: w.term,
          definition: w.definition ?? "",
          synonyms: {
            correct: w.synonyms?.correct ?? "",
            options: Array.isArray(w.synonyms?.options) ? w.synonyms.options.slice(0, 4) : [],
          },
          antonyms: {
            correct: w.antonyms?.correct ?? "",
            options: Array.isArray(w.antonyms?.options) ? w.antonyms.options.slice(0, 4) : [],
          },
        }));
        if (!cancelled) setWords(normalized);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load words.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [BASE, biome, pathIsValid]);

  React.useEffect(() => {
    // reset per-card UI when the current word changes
    setFlipped(false);
    setSynPick(null); setSynLocked(false);
    setAntPick(null); setAntLocked(false);
  }, [current?.term]);

  // ───────────────────────────────── helpers (no hooks below)
  const bg = `${BASE}images/overworld/${biome}.jpg`;
  const statusNow = loadAllStatus(dimension, biome);
  const completedOnceCount = words.filter(w => statusNow[w.term]?.answeredCorrectOnce).length;
  const masteredCount = words.filter(w => statusNow[w.term]?.mastered).length;
  const craftingCount = countItem(dimension, biome, "crafting_table");

  const synFirst = synPick !== null && synLocked && synPick === current?.synonyms.correct;
  const antFirst = antPick !== null && antLocked && antPick === current?.antonyms.correct;
  const rewardReady = !flipped && synFirst && antFirst;

  function pickSyn(opt: string) { if (!synLocked) { setSynPick(opt); setSynLocked(true); } }
  function pickAnt(opt: string) { if (!antLocked) { setAntPick(opt); setAntLocked(true); } }

  function saveAttempt() {
    if (!current) return;
    const statusMap = loadAllStatus(dimension, biome);
    const st: WordStatus = statusMap[current.term] ?? {};
    if (flipped) st.totalFlips = (st.totalFlips ?? 0) + 1;

    const bothCorrect = synPick === current.synonyms.correct && antPick === current.antonyms.correct;
    if (bothCorrect) {
      st.answeredCorrectOnce = true;
      st.lastResult = "success";
      if (rewardReady) {
        st.masteryStreak = (st.masteryStreak ?? 0) + 1;
        if ((st.masteryStreak ?? 0) >= 3) st.mastered = true;
        addItem(dimension, biome, "crafting_table", 1);
      }
    } else {
      st.lastResult = "fail";
    }

    statusMap[current.term] = st;
    saveAllStatus(dimension, biome, statusMap);
    setIdx(i => (pool.length ? (i + 1) % pool.length : 0));
    alert("Saved! ⛏️");
  }

  // ───────────────────────────────── render (branch with flags, not before hooks)
  if (!pathIsValid) {
    return (
      <main className="center-wrap">
        <div className="stack">
          <h1 className="h1">Unknown study path</h1>
          <Link className="mc-btn" to="/">Back to Home</Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="center-wrap">
        <div className="stack"><div className="card">Loading words…</div></div>
      </main>
    );
  }

  if (error || words.length === 0) {
    return (
      <main className="center-wrap">
        <div className="stack">
          <h1 className="h1">Oops</h1>
          <div className="card">{error ?? "No words available for this biome yet."}</div>
          <Link className="mc-btn" to={`/biome/${dimension}`}>Back to Overworld</Link>
        </div>
      </main>
    );
  }

  const currentWord = current!;

  return (
    <main className="hero study-hero" style={{ backgroundImage: `url(${bg})` }}>
      <nav className="top-right-nav">
        <Link className="mc-btn" to={`/biome/${dimension}`}>Back to Overworld</Link>
      </nav>

      <div className="center-wrap">
        <div className="study-grid">
          <section className="study-main card">
            <header className="study-header">
              <div>
                <div className="badge badge--overworld">{name}</div>
                <h2 style={{ margin: ".25rem 0 .5rem" }}>{blurb}</h2>
                <div style={{ fontSize: 12, opacity: .85 }}>
                  Completed once: <b>{completedOnceCount}</b> / {words.length} · Mastered: <b>{masteredCount}</b>
                </div>
              </div>
              <div className="study-nav">
                <button className="mc-btn" onClick={() => setIdx(i => (i > 0 ? i - 1 : pool.length - 1))}>◀ Prev</button>
                <div className="study-step">{(pool.indexOf(currentWord) + 1)} / {pool.length}</div>
                <button className="mc-btn" onClick={() => setIdx(i => (i < pool.length - 1 ? i + 1 : 0))}>Next ▶</button>
              </div>
            </header>

            <div className="mine-wrap">
              <h3 className="mine-title">⛏️ Mine the word</h3>
              <div className="mine-word">{currentWord.term}</div>

              <div className={`flip ${flipped ? "is-flipped" : ""}`} onClick={() => setFlipped(f => !f)}>
                <div className="flip-inner">
                  <div className="flip-face flip-front"><span>Tap to reveal definition</span></div>
                  <div className="flip-face flip-back"><span>{currentWord.definition || "Definition not set yet."}</span></div>
                </div>
              </div>

              <div className="mcq">
                <div className="mcq-title">Synonym</div>
                <div className="mcq-grid">
                  {currentWord.synonyms.options.map(opt => {
                    const chosen = synPick === opt;
                    const isCorrect = opt === currentWord.synonyms.correct;
                    const cls = [
                      "mcq-option",
                      synLocked && chosen && isCorrect && "correct",
                      synLocked && chosen && !isCorrect && "wrong",
                      synLocked && !chosen && "dim",
                    ].filter(Boolean).join(" ");
                    return (
                      <button key={opt} className={cls} disabled={synLocked} onClick={() => pickSyn(opt)}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mcq">
                <div className="mcq-title">Antonym</div>
                <div className="mcq-grid">
                  {currentWord.antonyms.options.map(opt => {
                    const chosen = antPick === opt;
                    const isCorrect = opt === currentWord.antonyms.correct;
                    const cls = [
                      "mcq-option",
                      antLocked && chosen && isCorrect && "correct",
                      antLocked && chosen && !isCorrect && "wrong",
                      antLocked && !chosen && "dim",
                    ].filter(Boolean).join(" ");
                    return (
                      <button key={opt} className={cls} disabled={antLocked} onClick={() => pickAnt(opt)}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: ".5rem", marginTop: ".75rem" }}>
              <button className="mc-btn" onClick={saveAttempt}>Save the world</button>
              {rewardReady ? (
                <div className="card" style={{ background: "#12340eaa", borderColor: "#0a2608" }}>
                  ✅ First try, no flip on both! <b>Crafting Table +1</b> earned.
                </div>
              ) : (
                <div className="card" style={{ background: "#1b1b1baa" }}>
                  Tip: Earn a <b>Crafting Table</b> by getting both MCQs right on your first try without flipping.
                </div>
              )}
            </div>
          </section>

          <aside className="study-side">
            <div className="side-card card">
              <h3 style={{ marginTop: 0 }}>Inventory Chest💎</h3>
              <p style={{ marginTop: ".25rem" }}>
                Crafting Tables: <b>{craftingCount}</b>
              </p>
              <div style={{ marginTop: ".5rem", fontSize: 12, opacity: .9 }}>
                Items are per-biome. Progress auto-saves.
              </div>
            </div>

            <div className="side-card card">
              <h3 style={{ marginTop: 0 }}>🧑‍🌾 Save the villagers</h3>
              <p style={{ margin: ".25rem 0" }}>There is a creeper attack!</p>
              <Link className="mc-btn" to={`/quest/${dimension}/${biome}`}>
                Save the villagers
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
