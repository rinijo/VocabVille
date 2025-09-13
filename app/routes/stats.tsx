import * as React from "react";
import { Link } from "react-router-dom";

const PICKAXES_PER_DIAMOND = 5;
const DIAMOND_PER_NETHERITE = 5;
const NETHERITE_PER_30MIN = 10;

type Item = "pickaxe" | "diamond" | "netherite";

type ItemCounts = { pickaxe: number; diamond: number; netherite: number };
type LifetimeCounts = { pickaxe: number; diamond: number; netherite: number; playMinutes: number };
type State = { lifetime: LifetimeCounts; current: ItemCounts };

type Action =
  | { type: "LOAD"; payload: State }
  | { type: "ADD_EARNED"; item: Item; amount: number }
  | { type: "SWAP_PICKAXE_TO_DIAMOND" }
  | { type: "SWAP_DIAMOND_TO_NETHERITE" }
  | { type: "REDEEM_NETHERITE_TO_PLAY" };

const STORAGE_KEY = "vv_stats_v2";
const STREAK_KEY = "vv_streak_v1";

const initialState: State = {
  lifetime: { pickaxe: 0, diamond: 0, netherite: 0, playMinutes: 0 },
  current: { pickaxe: 0, diamond: 0, netherite: 0 },
};

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

/** Normalize legacy shapes into the canonical nested state. */
function normalizeState(raw: any): State {
  // Already nested?
  if (raw && typeof raw === "object" && raw.lifetime && raw.current) {
    return {
      lifetime: { ...initialState.lifetime, ...raw.lifetime },
      current:  { ...initialState.current,  ...raw.current  },
    };
  }
  // Legacy flat { pickaxe, diamond, netherite }
  if (
    raw && typeof raw === "object" &&
    typeof raw.pickaxe === "number" &&
    typeof raw.diamond === "number" &&
    typeof raw.netherite === "number"
  ) {
    return {
      lifetime: { ...initialState.lifetime }, // start lifetime at 0
      current:  {
        pickaxe: raw.pickaxe | 0,
        diamond: raw.diamond | 0,
        netherite: raw.netherite | 0,
      },
    };
  }
  return clone(initialState);
}

function reducer(state: State, action: Action): State {
  const next = clone(state);

  switch (action.type) {
    case "LOAD":
      return clone(action.payload);

    case "ADD_EARNED":
      next.lifetime[action.item] += action.amount;
      (next.current as any)[action.item] += action.amount;
      return next;

    case "SWAP_PICKAXE_TO_DIAMOND": {
      const canMake = Math.floor(next.current.pickaxe / PICKAXES_PER_DIAMOND);
      if (canMake > 0) {
        next.current.pickaxe -= canMake * PICKAXES_PER_DIAMOND;
        next.current.diamond += canMake;
      }
      return next;
    }

    case "SWAP_DIAMOND_TO_NETHERITE": {
      const canMake = Math.floor(next.current.diamond / DIAMOND_PER_NETHERITE);
      if (canMake > 0) {
        next.current.diamond -= canMake * DIAMOND_PER_NETHERITE;
        next.current.netherite += canMake;
      }
      return next;
    }

    case "REDEEM_NETHERITE_TO_PLAY": {
      const blocks = Math.floor(next.current.netherite / NETHERITE_PER_30MIN);
      if (blocks > 0) {
        next.current.netherite -= blocks * NETHERITE_PER_30MIN;
        next.lifetime.playMinutes += blocks * 30;
      }
      return next;
    }

    default:
      return state;
  }
}

/** Persistent state: LAZY INIT from localStorage (fixes the reset), then persist. */
function usePersistentState() {
  const [state, dispatch] = React.useReducer(
    reducer,
    initialState,
    () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return initialState;
        return normalizeState(JSON.parse(raw));
      } catch {
        return initialState;
      }
    }
  );

  // Persist after any change
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Live-update if another page (quest) writes an award
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || e.storageArea !== localStorage) return;
      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        dispatch({ type: "LOAD", payload: normalizeState(parsed) });
      } catch {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { state, dispatch };
}

// -------- Streak state (read-only here) --------
type Streak = { lastDate: string | null; count: number };

function readStreak(): Streak {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { lastDate: null, count: 0 };
    const s = JSON.parse(raw);
    if (s && typeof s.count === "number") {
      return { lastDate: s.lastDate ?? null, count: s.count | 0 };
    }
  } catch {}
  return { lastDate: null, count: 0 };
}

function minutesToHHMM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function StatsPage() {
  const { state, dispatch } = usePersistentState();

  // streak UI bits
  const [streak, setStreak] = React.useState<Streak>(() => readStreak());
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STREAK_KEY || e.storageArea !== localStorage) return;
      setStreak(readStreak());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  // Also load once on mount (in case this page opens first)
  React.useEffect(() => { setStreak(readStreak()); }, []);

  const daysUntilDiamond = Math.max(0, 7 - (streak.count || 0));

  const canPXtoOB   = Math.floor(state.current.pickaxe / PICKAXES_PER_DIAMOND);
  const canOBtoNE   = Math.floor(state.current.diamond / DIAMOND_PER_NETHERITE);
  const canNEtoTime = Math.floor(state.current.netherite / NETHERITE_PER_30MIN);

  return (
    <>
      <style>{`
        .stats-wrap { min-height: 100dvh; padding: 20px; background-color: saddlebrown; display: flex; flex-direction: column; gap: 24px; }
        .card { padding: 20px; border-radius: 12px; background: forestgreen; color: white; }
        .section-title { margin: 0 0 12px; font-size: 20px; }
        .table-wrap { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 420px; }
        th, td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.3); text-align: left; }
        .row { display: flex; flex-wrap: wrap; gap: 12px; }
        .btn { padding: 10px 14px; border-radius: 8px; border: none; background: forestgreen; color: white; font-size: 14px; cursor: pointer; }
        .btn[disabled] { opacity: .5; cursor: not-allowed; }
        .rules-list { margin: 8px 0 0; padding-left: 18px; font-size: small; }
        .rules-list li { margin: 6px 0; }
      `}</style>

      <main className="stats-wrap">
        <nav className="top-right-nav">
          <Link className="mc-btn" to="/">Back to Home</Link>
        </nav>

        <header className="header">
          <h1 style={{ margin: 0, marginBottom: 20, marginTop: 40 }}>Stats & Swaps</h1>
          <span style={{ fontSize: 14 }}>5 ⛏️ = 1 💎 | 5 💎 = 1 ⬛ | 10 ⬛ = 30 min 🎮</span>
        </header>

        {/* Daily Streak */}
        <section className="card">
          <h2 className="section-title">Daily Quest Streak</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ opacity: 0.85, fontSize: 13 }}>Current streak</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 10 }}>{streak.count} day{streak.count === 1 ? "" : "s"}</div>
            </div>
            <div>
              <div style={{ opacity: 0.85, fontSize: 13 }}>Last attempt</div>
              <div style={{ fontSize: 18, marginTop: 10 }}>{streak.lastDate ?? "—"}</div>
            </div>
            <div>
              <div style={{ opacity: 0.85, fontSize: 13 }}>Days until next 💎</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 10 }}>{daysUntilDiamond}</div>
            </div>
          </div>
          <div style={{ marginTop: 8, opacity: 0.85, fontSize: 12 }}>
            Attempt any quest once per day. Hit 7 in a row to earn a Diamond — the counter then resets to start the next cycle.
          </div>
        </section>

        {/* How to earn rewards */}
        <section className="card">
          <h2 className="section-title">How to Earn Rewards</h2>
          <ul className="rules-list">
            <li>
              ⛏️ Pickaxe — awarded automatically when you fully learn a word:
              get the spelling, synonym and antonym correct enough to retire that word.
            </li>
            <li>
              ⬛ Netherite — awarded when you complete a quest successfully.
            </li>
            <li>
              💎 Diamond — awarded for a 7-day Daily Quest Streak (attempt a quest each day).
            </li>
          </ul>
        </section>

        {/* Inventory */}
        <section className="card">
          <h2 className="section-title">Inventory Chest</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Item</th><th>Lifetime</th><th>Current</th></tr>
              </thead>
              <tbody>
                <tr><td>⛏️ Pickaxe</td><td>{state.lifetime.pickaxe}</td><td>{state.current.pickaxe}</td></tr>
                <tr><td>💎 Diamond</td><td>{state.lifetime.diamond}</td><td>{state.current.diamond}</td></tr>
                <tr><td>⬛ Netherite</td><td>{state.lifetime.netherite}</td><td>{state.current.netherite}</td></tr>
                <tr>
                  <td>🎮 Minecraft Earned</td>
                  <td>{state.lifetime.playMinutes} <span style={{ opacity: 0.8 }}>({minutesToHHMM(state.lifetime.playMinutes)})</span></td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Conversion */}
        <h2 className="section-title" style={{ color: "white" }}>Convert & Redeem</h2>
        <div className="row">
          <button className="btn" disabled={!canPXtoOB} onClick={() => dispatch({ type: "SWAP_PICKAXE_TO_DIAMOND" })}>
            5 ⛏️ ➜ 1 💎 {canPXtoOB > 0 ? `(${canPXtoOB})` : ""}
          </button>
          <button className="btn" disabled={!canOBtoNE} onClick={() => dispatch({ type: "SWAP_DIAMOND_TO_NETHERITE" })}>
            5 💎 ➜ 1 ⬛ {canOBtoNE > 0 ? `(${canOBtoNE})` : ""}
          </button>
          <button className="btn" disabled={!canNEtoTime} onClick={() => dispatch({ type: "REDEEM_NETHERITE_TO_PLAY" })}>
            10 ⬛ ➜ 🎮 30m {canNEtoTime > 0 ? `(${canNEtoTime}×)` : ""}
          </button>
        </div>
      </main>
    </>
  );
}
