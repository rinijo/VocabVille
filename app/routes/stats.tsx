import * as React from "react";
import { Link } from "react-router-dom";

const PICKAXES_PER_DIAMOND = 5;
const DIAMOND_PER_NETHERITE = 5;
const NETHERITE_PER_30MIN = 10;

type Item = "pickaxe" | "diamond" | "netherite";

type ItemCounts = {
  pickaxe: number;
  diamond: number;
  netherite: number;
  // NOTE: playMinutes removed from "current" per your instruction
};

type LifetimeCounts = {
  pickaxe: number;
  diamond: number;
  netherite: number;
  playMinutes: number; // now tracked only in Lifetime
};

type State = {
  lifetime: LifetimeCounts;
  current: ItemCounts;
};

type Action =
  | { type: "LOAD"; payload: State }
  | { type: "ADD_EARNED"; item: Item; amount: number }
  | { type: "SWAP_PICKAXE_TO_DIAMOND" }
  | { type: "SWAP_DIAMOND_TO_NETHERITE" }
  | { type: "REDEEM_NETHERITE_TO_PLAY" };

const STORAGE_KEY = "vv_stats_v2";

const initialState: State = {
  lifetime: { pickaxe: 0, diamond: 0, netherite: 0, playMinutes: 0 },
  current: { pickaxe: 0, diamond: 0, netherite: 0 },
};

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function reducer(state: State, action: Action): State {
  const next = clone(state);

  switch (action.type) {
    case "LOAD": {
      // Minimal migration: if older data had current.playMinutes, move it into lifetime.playMinutes.
      const loaded = clone(action.payload);
      if (loaded && loaded.lifetime && typeof loaded.lifetime.playMinutes !== "number") {
        loaded.lifetime.playMinutes = 0;
      }
      // @ts-ignore - tolerate old schema
      const oldCurrentPM = loaded?.current?.playMinutes;
      if (typeof oldCurrentPM === "number" && oldCurrentPM > 0) {
        loaded.lifetime.playMinutes += oldCurrentPM;
        // @ts-ignore - delete old field if present
        delete loaded.current.playMinutes;
      }
      return loaded;
    }

    case "ADD_EARNED": {
      next.lifetime[action.item] += action.amount;
      (next.current as any)[action.item] += action.amount;
      return next;
    }

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
      const redeemBlocks = Math.floor(next.current.netherite / NETHERITE_PER_30MIN);
      if (redeemBlocks > 0) {
        next.current.netherite -= redeemBlocks * NETHERITE_PER_30MIN;
        next.lifetime.playMinutes += redeemBlocks * 30; // add to Lifetime only
      }
      return next;
    }

    default:
      return state;
  }
}

function usePersistentState() {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  React.useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        dispatch({ type: "LOAD", payload: JSON.parse(raw) });
      } catch {}
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return { state, dispatch };
}

function minutesToHHMM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function StatsPage() {
  const { state, dispatch } = usePersistentState();

  const canPXtoOB = Math.floor(state.current.pickaxe / PICKAXES_PER_DIAMOND);
  const canOBtoNE = Math.floor(state.current.diamond / DIAMOND_PER_NETHERITE);
  const canNEtoTime = Math.floor(state.current.netherite / NETHERITE_PER_30MIN);

  return (
    <>
      <style>{`
        .stats-wrap {
          min-height: 100dvh;
          padding: 20px;
          background-color: saddlebrown; 
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .topbar {
          display: flex;
          justify-content: flex-end; /* top-right button */
        }

        .header {
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .card {
          padding: 20px;
          border-radius: 12px;
          background: forestgreen; 
          color: white;
        }

        .section-title {
          margin: 0 0 12px;
          font-size: 20px;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 420px;
        }

        th, td {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          text-align: left;
        }

        .row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .btn {
          padding: 10px 14px;
          border-radius: 8px;
          border: none;
          background: forestgreen; /* keep your original button colour */
          color: white;
          font-size: 14px;
          cursor: pointer;
        }
        .btn[disabled] {
          opacity: .5;
          cursor: not-allowed;
        }
      `}</style>

      <main className="stats-wrap">
      <nav className="top-right-nav">
        <Link className="mc-btn" to="/">Back to Home</Link>
      </nav>

        <header className="header">
          <h1 style={{ margin: 0, marginBottom: 20 }}>Stats & Swaps</h1>
          <span style={{ fontSize: 14 }}>
            5 ⛏️ = 1 💎 | 5 💎 = 1 ⬛ | 10 ⬛ = 30 min 🎮
          </span>
        </header>

        {/* Inventory */}
        <section className="card">
          <h2 className="section-title">Inventory Chest</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Lifetime</th>
                  <th>Current</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>⛏️ Pickaxe</td>
                  <td>{state.lifetime.pickaxe}</td>
                  <td>{state.current.pickaxe}</td>
                </tr>
                <tr>
                  <td>💎 Diamond</td>
                  <td>{state.lifetime.diamond}</td>
                  <td>{state.current.diamond}</td>
                </tr>
                <tr>
                  <td>⬛ Netherite</td>
                  <td>{state.lifetime.netherite}</td>
                  <td>{state.current.netherite}</td>
                </tr>
                <tr>
                  <td>🎮 Minecraft Earned</td>
                  <td>
                    {state.lifetime.playMinutes}{" "}
                    <span style={{ opacity: 0.8 }}>
                      ({minutesToHHMM(state.lifetime.playMinutes)})
                    </span>
                  </td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        {/* Conversion */}
        <h2 className="section-title" style={{ color: "white" }}>
          Convert & Redeem
        </h2>
        <div className="row">
          <button
            className="btn"
            disabled={!canPXtoOB}
            onClick={() => dispatch({ type: "SWAP_PICKAXE_TO_DIAMOND" })}
          >
            5 ⛏️ ➜ 1 💎 {canPXtoOB > 0 ? `(${canPXtoOB})` : ""}
          </button>
          <button
            className="btn"
            disabled={!canOBtoNE}
            onClick={() => dispatch({ type: "SWAP_DIAMOND_TO_NETHERITE" })}
          >
            5 💎 ➜ 1 ⬛ {canOBtoNE > 0 ? `(${canOBtoNE})` : ""}
          </button>
          <button
            className="btn"
            disabled={!canNEtoTime}
            onClick={() => dispatch({ type: "REDEEM_NETHERITE_TO_PLAY" })}
          >
            10 ⬛ ➜ 🎮 30m {canNEtoTime > 0 ? `(${canNEtoTime}×)` : ""}
          </button>
        </div>
      </main>
    </>
  );
}
