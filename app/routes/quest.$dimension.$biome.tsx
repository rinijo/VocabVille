import * as React from "react";
import { Link, useParams } from "react-router-dom";
import CreeperBg from "../components/CreeperBg";

const BASE = import.meta.env.BASE_URL;

type QAType = "spelling" | "synonym" | "antonym";

/** JSON in public/words/<dimension>/<biome>.json */
type JsonWord = {
  term: string;
  definition?: string;
  synonyms?: { correct: string; options: string[] };
  antonyms?: { correct: string; options: string[] };
};

type ProgressCounters = {
  spelling: number;
  synonym: number;
  antonym: number;
  retired?: boolean;
};
type ProgressMap = Record<string, ProgressCounters>;

type Question = {
  type: QAType;
  word: string;
  prompt: string;
  options: string[];      // 4 options, 1 correct
  correctIndex: number;
  speakable?: string;     // for spelling
};

// Storage keys
const STATS_KEY = "vv_stats_v2";
const progressKey = (dim: string, biome: string) => `vv_progress_${dim}_${biome}`;

// Utils
const randInt = (n: number) => Math.floor(Math.random() * n);
const shuffled = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function misspellingsOf(word: string): string[] {
  const outs = new Set<string>();
  const lower = word.toLowerCase();
  const vowels = new Set(["a", "e", "i", "o", "u"]);

  // swap neighbors
  for (let i = 0; i < lower.length - 1; i++) {
    outs.add(lower.slice(0, i) + lower[i + 1] + lower[i] + lower.slice(i + 2));
    if (outs.size >= 5) break;
  }
  // drop a vowel
  for (let i = 0; i < lower.length; i++) {
    if (vowels.has(lower[i])) outs.add(lower.slice(0, i) + lower.slice(i + 1));
    if (outs.size >= 8) break;
  }
  // double a consonant
  for (let i = 0; i < lower.length; i++) {
    const c = lower[i];
    if (!vowels.has(c) && /[a-z]/.test(c)) outs.add(lower.slice(0, i + 1) + c + lower.slice(i + 1));
    if (outs.size >= 12) break;
  }
  outs.delete(lower);
  return Array.from(outs);
}

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

// -------- Progress helpers --------
function loadProgress(dim: string, biome: string): ProgressMap {
  try {
    const raw = localStorage.getItem(progressKey(dim, biome));
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
function saveProgress(dim: string, biome: string, map: ProgressMap) {
  localStorage.setItem(progressKey(dim, biome), JSON.stringify(map));
}

function isTypeRetiredByCount(p: ProgressCounters | undefined, type: QAType): boolean {
  if (!p) return false;
  return (p[type] || 0) >= 5; // retire this type at 5+
}
function isWordRetiredByCounts(p: ProgressCounters | undefined): boolean {
  if (!p) return false;
  return (p.spelling || 0) >= 5 && (p.synonym || 0) >= 5 && (p.antonym || 0) >= 5;
}

function bumpProgress(dim: string, biome: string, word: string, type: QAType): ProgressMap {
  const map = loadProgress(dim, biome);
  const w = (map[word] ||= { spelling: 0, synonym: 0, antonym: 0, retired: false });
  w[type] += 1;

  // Original rule: retire when all three reach ≥3
  if (w.spelling >= 3 && w.synonym >= 3 && w.antonym >= 3) w.retired = true;

  // New additive rule: retire whole word when all three reach ≥5
  if (w.spelling >= 5 && w.synonym >= 5 && w.antonym >= 5) w.retired = true;

  saveProgress(dim, biome, map);
  return map;
}

// Award netherite on win (robust init + legacy flat migration)
function awardNetherite() {
  const defaults = {
    lifetime: { pickaxe: 0, diamond: 0, netherite: 0, playMinutes: 0 },
    current:  { pickaxe: 0, diamond: 0, netherite: 0 },
  };

  let state = { ...defaults };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // legacy flat {pickaxe, diamond, netherite}
      if (
        parsed && typeof parsed === "object" &&
        !parsed.lifetime && !parsed.current &&
        typeof parsed.pickaxe === "number" &&
        typeof parsed.diamond === "number" &&
        typeof parsed.netherite === "number"
      ) {
        state = {
          lifetime: { ...defaults.lifetime },
          current: {
            pickaxe: parsed.pickaxe | 0,
            diamond: parsed.diamond | 0,
            netherite: parsed.netherite | 0,
          },
        };
      } else {
        state = {
          lifetime: { ...defaults.lifetime, ...(parsed?.lifetime || {}) },
          current:  { ...defaults.current,  ...(parsed?.current  || {}) },
        };
      }
    }
  } catch {
    // ignore parse errors, keep defaults
  }

  state.lifetime.netherite = (state.lifetime.netherite || 0) + 1;
  state.current.netherite  = (state.current.netherite  || 0) + 1;

  localStorage.setItem(STATS_KEY, JSON.stringify(state));
  try { window.dispatchEvent(new StorageEvent("storage", { key: STATS_KEY })); } catch {}
}

// -------- Question builders --------
function buildSpellingQuestion(w: JsonWord): Question {
  const correct = w.term;
  const bads = misspellingsOf(correct);
  const opts = shuffled([correct, ...shuffled(bads).slice(0, 3)]);
  return {
    type: "spelling",
    word: w.term,
    prompt: "Spell the word you hear:",
    options: opts,
    correctIndex: opts.findIndex((o) => o.toLowerCase() === correct.toLowerCase()),
    speakable: w.term,
  };
}
function buildSynonymQuestion(w: JsonWord): Question | null {
  if (!w.synonyms || !w.synonyms.options?.length) return null;
  const opts = [...w.synonyms.options];
  const correct = w.synonyms.correct;
  const shuffledOpts = shuffled(opts);
  return {
    type: "synonym",
    word: w.term,
    prompt: `Choose a synonym of “${w.term}”`,
    options: shuffledOpts,
    correctIndex: shuffledOpts.findIndex((o) => o === correct),
  };
}
function buildAntonymQuestion(w: JsonWord): Question | null {
  if (!w.antonyms || !w.antonyms.options?.length) return null;
  const opts = [...w.antonyms.options];
  const correct = w.antonyms.correct;
  const shuffledOpts = shuffled(opts);
  return {
    type: "antonym",
    word: w.term,
    prompt: `Choose an antonym of “${w.term}”`,
    options: shuffledOpts,
    correctIndex: shuffledOpts.findIndex((o) => o === correct),
  };
}

// Type-aware builder (skip retired types for this word)
function buildQuestionFrom(w: JsonWord, prog?: ProgressCounters): Question | null {
  const types: QAType[] = [];
  if (!isTypeRetiredByCount(prog, "spelling")) types.push("spelling");
  if (w.synonyms?.options?.length && !isTypeRetiredByCount(prog, "synonym")) types.push("synonym");
  if (w.antonyms?.options?.length && !isTypeRetiredByCount(prog, "antonym")) types.push("antonym");
  if (types.length === 0) return null;

  const t = types[randInt(types.length)];
  if (t === "synonym") return buildSynonymQuestion(w) ?? buildSpellingQuestion(w);
  if (t === "antonym") return buildAntonymQuestion(w) ?? buildSpellingQuestion(w);
  return buildSpellingQuestion(w);
}

export default function QuestPage() {
  const { dimension = "", biome = "" } = useParams();

  const PREP_SECONDS = 5;
  const DURATION_SECONDS = 180;
  const TOTAL_QUESTIONS = 10;

  const [prepLeft, setPrepLeft] = React.useState(PREP_SECONDS);
  const [timeLeft, setTimeLeft] = React.useState(DURATION_SECONDS);
  const [running, setRunning] = React.useState(false);
  const [score, setScore] = React.useState(0);

  const [words, setWords] = React.useState<JsonWord[]>([]);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [qIndex, setQIndex] = React.useState(0);
  const [status, setStatus] = React.useState<"idle" | "playing" | "won" | "lost">("idle");
  const [message, setMessage] = React.useState("");

  // Load JSON for this biome
  React.useEffect(() => {
    let aborted = false;
    const url = `${BASE}words/${dimension}/${biome}.json`;
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load words: ${res.status}`);
        const data: JsonWord[] = await res.json();
        if (!aborted) setWords(Array.isArray(data) ? data : []);
      } catch {
        if (!aborted)
          setWords([
            { term: "courage", synonyms: { correct: "bravery", options: ["bravery","fear","panic","doubt"] }, antonyms: { correct: "fear", options: ["fear","valor","boldness","pluck"] } },
            { term: "ancient", synonyms: { correct: "old", options: ["old","modern","current","new"] }, antonyms: { correct: "modern", options: ["modern","elderly","antique","archaic"] } },
          ]);
      }
    })();
    return () => { aborted = true; };
  }, [dimension, biome]);

  // Build 10 Qs ONCE per session, after words load
  React.useEffect(() => {
    if (!words.length) {
      setQuestions([]);
      return;
    }

    // Snapshot current progress to apply retirement rules
    const progressSnapshot = loadProgress(dimension, biome);

    // Word-level retirement: explicit retired OR 5+/5+/5+ rule
    const retiredTerms = new Set<string>(
      Object.entries(progressSnapshot)
        .filter(([, v]) => v.retired || isWordRetiredByCounts(v))
        .map(([k]) => k)
    );

    // Keep words that either aren't fully retired and still have at least one non-retired type
    const eligibleWords = words.filter((w) => {
      if (retiredTerms.has(w.term)) return false;
      const p = progressSnapshot[w.term];
      const hasAnyType =
        !isTypeRetiredByCount(p, "spelling") ||
        (w.synonyms?.options?.length && !isTypeRetiredByCount(p, "synonym")) ||
        (w.antonyms?.options?.length && !isTypeRetiredByCount(p, "antonym"));
      return hasAnyType;
    });

    const source = eligibleWords.length ? eligibleWords : words;

    const qs: Question[] = [];
    let guard = 0;
    while (qs.length < TOTAL_QUESTIONS && guard < TOTAL_QUESTIONS * 20) {
      const w = source[randInt(source.length)];
      const q = buildQuestionFrom(w, progressSnapshot[w.term]);
      if (q) qs.push(q);
      guard++;
    }

    // Final fallback to avoid a blank screen if everything is retired
    if (qs.length === 0) {
      for (let i = 0; i < Math.min(TOTAL_QUESTIONS, words.length || 10); i++) {
        qs.push(buildSpellingQuestion(words[i % words.length]));
      }
    }

    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setMessage("");
    // status stays "idle"; timer effect flips it to "playing"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, dimension, biome]);

  // Timer lifecycle (prep → play)
  React.useEffect(() => {
    let prepInterval: number | undefined;
    let runInterval: number | undefined;

    setPrepLeft(PREP_SECONDS);
    setTimeLeft(DURATION_SECONDS);
    setRunning(false);
    setStatus("idle");

    prepInterval = window.setInterval(() => {
      setPrepLeft((p) => {
        if (p <= 1) {
          window.clearInterval(prepInterval);
          setRunning(true);
          setStatus("playing");
          runInterval = window.setInterval(() => {
            setTimeLeft((t) => {
              if (t <= 1) {
                window.clearInterval(runInterval);
                setRunning(false);
                setStatus((s) => (s === "playing" ? "lost" : s));
                setMessage("⏰ Time’s up! The villagers were not saved.");
                return 0;
              }
              return t - 1;
            });
          }, 1000);
          return 0;
        }
        return p - 1;
      });
    }, 1000);

    return () => {
      if (prepInterval) window.clearInterval(prepInterval);
      if (runInterval) window.clearInterval(runInterval);
    };
  }, [dimension, biome]);

  function answer(idx: number) {
    if (status !== "playing") return;
    const q = questions[qIndex];
    const isCorrect = idx === q.correctIndex;

    if (!isCorrect) {
      setStatus("lost");
      setMessage(`❌ Wrong! The correct answer was “${q.options[q.correctIndex]}”.`);
      setRunning(false);
      return;
    }

    setScore((s) => s + 1);
    // Update counters (type retirement handled next session via snapshot)
    bumpProgress(dimension, biome, q.word, q.type);

    if (qIndex + 1 >= questions.length) {
      if (timeLeft > 0) {
        setStatus("won");
        setMessage("✅ Perfect! You saved the villagers and earned 1 ⬛ Netherite!");
        setRunning(false);
        awardNetherite();
      } else {
        setStatus("lost");
        setMessage("⏰ Time’s up just as you finished!");
      }
    } else {
      setQIndex((i) => i + 1);
    }
  }

  const bg = `${BASE}images/overworld/${biome}-quest-bg.png`;

  function RightPanel() {
    if (status === "won" || status === "lost") {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", width: "100%", height: "100%" }}>
          <div style={{ background: status === "won" ? "#2ecc71" : "#e74c3c", color: "#000", padding: 18, borderRadius: 12, boxShadow: "0 6px 0 #000", maxWidth: 580 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{status === "won" ? "VICTORY!" : "FAILED!"}</div>
            <div style={{ marginBottom: 10 }}>{message}</div>
            <div>Score: <b>{score}</b> / {Math.max(questions.length, 10)}</div>
            <div style={{ marginTop: 16 }}>
              <Link className="mc-btn" to={`/study/${dimension}/${biome}`}>Back to Study</Link>
            </div>
          </div>
        </div>
      );
    }

    if (prepLeft > 0) {
      return (
        <div style={{ opacity: 0.9 }}>
          <h3 style={{ marginTop: 0, color: "white" }}>Get Ready…</h3>
          <p style={{ color: "white" }}>Quest starts in <b>{prepLeft}</b>…</p>
        </div>
      );
    }

    const q = questions[qIndex];
    if (!q) return <div>Preparing questions…</div>;

    return (
      <div style={{ width: "100%" }}>
        <div style={{ marginBottom: 10, opacity: 0.9, color: "white" }}>
          Question {qIndex + 1} of {Math.max(questions.length, 10)}
        </div>

        {/* Solid card so only the question area has a background */}
        <div style={{ background: "#f4d88a", color: "#000", borderRadius: 12, padding: 16, boxShadow: "0 6px 0 #000", marginBottom: 14 }}>
          <div style={{ marginBottom: 10 }}>
            {q.type === "spelling" ? (
              <>
                <span>{q.prompt} </span>
                <button
                  onClick={() => q.speakable && speak(q.speakable)}
                  title="Play word"
                  style={{ marginLeft: 10, border: "none", background: "#ffd166", padding: "8px 10px", borderRadius: 8, cursor: "pointer" }}
                >
                  🔊
                </button>
              </>
            ) : (
              <span>{q.prompt}</span>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answer(i)}
                className="mc-btn"
                style={{ textAlign: "center", padding: "10px 12px", background: "#3c8527", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, opacity: 0.85, color: "white" }}>
          {q.type === "spelling"
            ? "Listen carefully and choose the correct spelling."
            : q.type === "synonym"
            ? "Pick the word with a similar meaning."
            : "Pick the word with the opposite meaning."}
        </div>
      </div>
    );
  }

  return (
    <main className="hero" style={{ backgroundImage: `url(${bg})`, position: "relative" }}>
      <CreeperBg duration="6s" />

      <nav className="top-right-nav" style={{ zIndex: 2 }}>
        <Link className="mc-btn" to={`/study/${dimension}/${biome}`}>Back to Study</Link>
      </nav>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gridTemplateRows: "1fr 1fr",
          gridTemplateAreas: `"leftTop right" "leftBottom right"`,
          minHeight: "100svh",
        }}
      >
        {/* Left top — content pinned to bottom */}
        <div
          style={{
            gridArea: "leftTop",
            margin: 4,
            padding: "1rem",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <p
            style={{
              pointerEvents: "auto",
              fontFamily: "'Press Start 2P', system-ui, sans-serif",
              fontSize: "clamp(12px, 2vw, 18px)",
              lineHeight: 1.6,
              textShadow: "1px 1px 0 #000",
              margin: 0,
            }}
          >
            THE VILLAGE IS UNDER ATTACK!
            <br /><br />
            ⚡ A horde of creepers is closing in on the village!
            <br /><br />
            🛡️ Answer 10 questions in 3 minutes to save the villagers and earn a Netherite reward!
          </p>
        </div>

        {/* Left bottom — content pinned to top */}
        <div
          style={{
            gridArea: "leftBottom",
            margin: 4,
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "1.0rem",
            fontFamily: "'Press Start 2P', system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: "clamp(23px, 5vw, 33px)", textShadow: "2px 2px 0 #000", marginTop: 0 }}>
            Score: <b>{score}</b>/10
          </div>
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "#3c8527",
              border: "6px solid #1b1b1b",
              boxShadow: "0 6px 0 #2c611d, 0 8px 0 #000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "clamp(24px, 6vw, 40px)",
              color: "#fff",
              textShadow: "2px 2px 0 #000",
            }}
          >
            {prepLeft > 0 ? `:${prepLeft}` : `${timeLeft}`}
          </div>
        </div>

        {/* Right — transparent panel so Creeper anim shows; only the card inside is solid */}
        <div
          style={{
            gridArea: "right",
            margin: 4,
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Press Start 2P', system-ui, sans-serif",
            fontSize: "clamp(12px, 2vw, 18px)",
            color: "#000",
            textAlign: "center",
            background: "transparent",
          }}
        >
          <RightPanel />
        </div>
      </div>
    </main>
  );
}
