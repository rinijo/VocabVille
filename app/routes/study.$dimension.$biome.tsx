// app/routes/study.$dimension.$biome.tsx
import * as React from "react";
import { Link, useParams } from "react-router-dom";

// Adjust these paths if your folders differ
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
const UNLOCKS_KEY = "vocabville:biome:unlocks"; // must match your map reader
const BASE = import.meta.env.BASE_URL ?? "/";

const titleCase = (s: string) =>
  s.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

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
  try {
    localStorage.setItem(statusScope(d, b), JSON.stringify(map));
  } catch {
    // ignore
  }
};

/**
 * Defensive seeding:
 * Ensure the very first biome (overworld/plains) appears "present" so any
 * unlock checks based on "does a status key exist?" pass on first run.
 */
function ensureFirstBiomeUnlocked() {
  try {
    const key = statusScope("overworld", "plains");
    if (!localStorage.getItem(key)) {
      // Minimal, idempotent value; UI usually checks for existence/truthy JSON
      localStorage.setItem(key, JSON.stringify({ unlocked: true, __seeded: true }));
    }
  } catch {
    // ignore storage errors (e.g., private mode)
  }
}

/** Flatten overworld biome list and find the "next" slug after the current one. */
function getNextBiomeSlug(currentSlug: string): string | null {
  const all = OVERWORLD_CATEGORIES.flatMap((c) => c.biomes);
  const i = all.findIndex((b) => b.slug === currentSlug);
  if (i === -1 || i + 1 >= all.length) return null;
  return all[i + 1].slug;
}

/** If every word in (dimension, biome) is mastered, unlock the next biome. */
function unlockNextBiomeIfComplete(
  dimension: string,
  biome: string,
  words: WordCard[]
): { unlockedSlug: string | null } {
  try {
    const status = loadAllStatus(dimension, biome);
    const allMastered =
      words.length > 0 &&
      words.every((w) => status[w.term]?.mastered === true);

    if (!allMastered) return { unlockedSlug: null };

    const nextSlug = getNextBiomeSlug(biome);
    if (!nextSlug) return { unlockedSlug: null };

    // Update central unlocks object: { [dimension]: { [biome]: true } }
    const raw = localStorage.getItem(UNLOCKS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    const bucket = { ...(obj?.[dimension] ?? {}) };

    if (!bucket[nextSlug]) {
      bucket[nextSlug] = true;
      const merged = { ...obj, [dimension]: bucket };
      localStorage.setItem(UNLOCKS_KEY, JSON.stringify(merged));
      return { unlockedSlug: nextSlug };
    }
    return { unlockedSlug: null };
  } catch {
    return { unlockedSlug: null };
  }
}

export default function StudyPage() {
  // Ensure Plains is seeded even if a user lands here first
  ensureFirstBiomeUnlocked();

  // ───────────────────────────────── params/state
  const { dimension = "", biome = "" } = useParams();
  const dim = (dimension || "").toLowerCase();

  const validDimension = dim === "overworld";
  const pathIsValid = validDimension && !!biome;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [words, setWords] = React.useState<WordCard[]>([]);
  const [name, setName] = React.useState(titleCase(biome || ""));
  const [blurb, setBlurb] = React.useState("");

  // Status snapshot used for initial filtering; we also re-read on demand
  const statusInitial = React.useMemo(
    () => loadAllStatus(dimension, biome),
    [dimension, biome]
  );

  const active = React.useMemo(
    () => words.filter((w) => !statusInitial[w.term]?.mastered),
    [words, statusInitial]
  );
  const pool = active.length ? active : words;

  const [idx, setIdx] = React.useState(0);
  const current = pool[idx];

  const [flipped, setFlipped] = React.useState(false);

  // MCQ picks (changeable, final evaluation on submit)
  const [synPick, setSynPick] = React.useState<string | null>(null);
  const [antPick, setAntPick] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  // 🔤 spelling
  const [spellValue, setSpellValue] = React.useState("");

  // Toast popup state (auto hides in 3s)
  const [toast, setToast] = React.useState<{ kind: "success" | "error" | "info"; msg: string } | null>(null);
  const toastTimerRef = React.useRef<number | null>(null);
  const showToast = (kind: "success" | "error" | "info", msg: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ kind, msg });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000);
  };

  // Set biome name & blurb
  React.useEffect(() => {
    const allBiomes = OVERWORLD_CATEGORIES.flatMap((c) => c.biomes);
    const match = allBiomes.find((b) => b.slug === biome);
    setName(match?.name ?? titleCase(biome || ""));
    setBlurb(
      ({ plains: "Flat grasslands with villages and friendly mobs." } as Record<string, string>)[
        biome || ""
      ] ?? `Explore the ${match?.name ?? titleCase(biome || "")} biome.`
    );
  }, [biome]);

  // Load words JSON
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (!pathIsValid) throw new Error("Unknown study path.");
        const res = await fetch(`${BASE}words/overworld/${biome}.json`, { cache: "no-store" });
        if (!res.ok) throw new Error("Words not found for this biome.");
        const raw: WordCard[] = await res.json();

        // Normalize to ensure options arrays exist and are capped to 4
        const normalized: WordCard[] = raw.map((w) => ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biome, pathIsValid]);

  // Reset per-card UI when the current word changes
  React.useEffect(() => {
    setFlipped(false);
    setSynPick(null);
    setAntPick(null);
    setSubmitted(false);
    setSpellValue("");
  }, [current?.term]);

  // Cleanup toast timer
  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // ───────────────────────────────── helpers
  const bg = `${BASE}images/overworld/${biome}.jpg`;

  // Read a fresh snapshot when we need counts
  const statusNow = loadAllStatus(dimension, biome);
  const completedOnceCount = words.filter((w) => statusNow[w.term]?.answeredCorrectOnce).length;
  const masteredCount = words.filter((w) => statusNow[w.term]?.mastered).length;
  const craftingCount = countItem(dimension, biome, "crafting_table");

  const normalize = (s: string) =>
    s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  function speakWord(word: string) {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      const voices = window.speechSynthesis.getVoices();
      const en = voices.find((v) => /en(-|_|$)/i.test(v.lang));
      if (en) u.voice = en;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  }

  function saveAttempt() {
    if (!current) return;

    const statusMap = loadAllStatus(dimension, biome);
    const st: WordStatus = statusMap[current.term] ?? {};

    if (flipped) st.totalFlips = (st.totalFlips ?? 0) + 1;

    const synCorrect = synPick === current.synonyms.correct;
    const antCorrect = antPick === current.antonyms.correct;
    const spellCorrect = normalize(spellValue) === normalize(current.term);

    const allCorrect = synCorrect && antCorrect && spellCorrect;

    if (allCorrect) {
      st.answeredCorrectOnce = true;
      st.lastResult = "success";
      st.masteryStreak = (st.masteryStreak ?? 0) + (!flipped ? 1 : 0);
      if ((st.masteryStreak ?? 0) >= 3) st.mastered = true;

      // Award a crafting table on perfect first-try (or when not flipped)
      if (!flipped) addItem(dimension, biome, "crafting_table", 1);

      showToast("success", "Correct! ✅");
    } else {
      st.lastResult = "fail";
      st.masteryStreak = 0;

      // Build a detailed error message
      const wrong: string[] = [];
      if (!synCorrect) wrong.push("Synonym");
      if (!antCorrect) wrong.push("Antonym");
      if (!spellCorrect) wrong.push("Spelling");

      let msg = "Wrong ❌ — ";
      if (wrong.length === 3) msg += "all three are incorrect.";
      else if (wrong.length === 2) msg += `${wrong[0]} and ${wrong[1]} are incorrect.`;
      else msg += `${wrong[0]} is incorrect.`;

      if (!spellCorrect && synCorrect && antCorrect) {
        msg += ` The word was: ${current.term.toUpperCase()}`;
      }

      showToast("error", msg);
    }

    statusMap[current.term] = st;
    saveAllStatus(dimension, biome, statusMap);

    // 🔓 After saving the attempt, if *all words* are mastered in this biome,
    // unlock the next biome and notify the user once.
    const { unlockedSlug } = unlockNextBiomeIfComplete(dimension, biome, words);
    if (unlockedSlug) {
      showToast("info", `🎉 New biome unlocked: ${titleCase(unlockedSlug)}!`);
    }

    setSubmitted(true);

    // Move to next item to keep the flow
    setIdx((i) => (pool.length ? (i + 1) % pool.length : 0));
  }

  // ───────────────────────────────── render
  if (!pathIsValid) {
    return (
      <main className="center-wrap">
        <div className="stack">
          <h1 className="h1">Unknown study path</h1>
          <Link className="mc-btn" to="/">Back to Overworld</Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="center-wrap">
        <div className="stack">
          <div className="card">Loading words…</div>
        </div>
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
          <section className="study-main card" style={{ position: "relative" }}>
            <header className="study-header">
              <div>
                <div className="badge badge--overworld">{name}</div>
                <h2 style={{ margin: ".25rem 0 .5rem" }}>{blurb}</h2>
              </div>

              <div className="study-nav">
                <button
                  className="mc-btn"
                  onClick={() =>
                    setIdx((i) => (i > 0 ? i - 1 : pool.length - 1))
                  }
                >
                  ◀ Prev
                </button>
                <div className="study-step">
                  {pool.indexOf(currentWord) + 1} / {pool.length}
                </div>
                <button
                  className="mc-btn"
                  onClick={() =>
                    setIdx((i) => (i < pool.length - 1 ? i + 1 : 0))
                  }
                >
                  Next ▶
                </button>
              </div>
            </header>

            <div className="mine-wrap">
              <h3 className="mine-title">⛏️ Mine the word</h3>
              <div className="mine-word">{currentWord.term}</div>

              <div
                className={`flip ${flipped ? "is-flipped" : ""}`}
                onClick={() => setFlipped((f) => !f)}
              >
                <div className="flip-inner">
                  <div className="flip-face flip-front">
                    <span>Tap to reveal definition</span>
                  </div>
                  <div className="flip-face flip-back">
                    <span>{currentWord.definition || "Definition not set yet."}</span>
                  </div>
                </div>
              </div>

              {/* Synonyms */}
              <div className="mcq">
                <div className="mcq-title">Synonym</div>
                <div className="mcq-grid">
                  {currentWord.synonyms.options.map((opt) => {
                    const chosen = synPick === opt;
                    const cls = ["mcq-option", chosen && "selected"]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <button
                        key={opt}
                        className={cls}
                        onClick={() => setSynPick(opt)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Antonyms */}
              <div className="mcq">
                <div className="mcq-title">Antonym</div>
                <div className="mcq-grid">
                  {currentWord.antonyms.options.map((opt) => {
                    const chosen = antPick === opt;
                    const cls = ["mcq-option", chosen && "selected"]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <button
                        key={opt}
                        className={cls}
                        onClick={() => setAntPick(opt)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 🔊 Hear & Spell */}
            <div className="card" style={{ marginTop: ".75rem", padding: ".75rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: ".5rem",
                }}
              >
                <div className="mcq-title" style={{ margin: 0 }}>
                  Hear &amp; Spell
                </div>
                <button
                  type="button"
                  className="mc-btn"
                  onClick={() => speakWord(currentWord.term)}
                  aria-label="Play the word"
                  title="Play the word"
                >
                  🔊 Play
                </button>
              </div>

              {/* Underscore mask that fills as you type */}
              <div
                className="mine-word"
                style={{
                  fontFamily: "monospace",
                  letterSpacing: "0.35rem",
                  textAlign: "center",
                  marginTop: ".5rem",
                  userSelect: "none",
                }}
                aria-hidden
              >
                {currentWord.term
                  .split("")
                  .map((_, i) => (spellValue[i]?.toUpperCase() ?? "_"))
                  .join(" ")}
              </div>

              {/* Input (letters only) */}
              <input
                inputMode="text"
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
                maxLength={currentWord.term.length}
                value={spellValue}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^a-zA-Z]/g, "");
                  setSpellValue(next.slice(0, currentWord.term.length));
                  if (submitted) setSubmitted(false);
                }}
                placeholder={"_".repeat(Math.min(12, currentWord.term.length))}
                className="input spelling-input"
                style={{
                  width: "100%",
                  marginTop: ".5rem",
                  textAlign: "center",
                  textTransform: "uppercase",
                }}
                aria-label="Type the spelling you heard"
              />
            </div>

            <div style={{ display: "grid", gap: ".5rem", marginTop: ".75rem" }}>
              <button className="mc-btn" onClick={saveAttempt}>
                Submit
              </button>
              <div className="card" style={{ background: "#1b1b1baa" }}>
                Tip: You can change your answers before submitting. No correctness
                is shown until submit.
              </div>
            </div>
          </section>

          <aside className="study-side">
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

      {/* Toast popup (auto hides in 3s) */}
      {toast && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            background:
              toast.kind === "success" ? "#195c28" :
              toast.kind === "error"   ? "#6b2f1f" : "#244e7a",
            color: "#fff",
            border: "4px solid #1b1b1b",
            boxShadow: "0 8px 0 #000",
            padding: "0.85rem 1.1rem",
            fontFamily: "'Press Start 2P', system-ui, sans-serif",
            fontSize: "14px",
            textAlign: "center",
            maxWidth: "min(90%, 420px)",
          }}
          role="status"
          aria-live="assertive"
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
