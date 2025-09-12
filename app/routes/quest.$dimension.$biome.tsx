import * as React from "react";
import { Link, useParams } from "react-router-dom";
import CreeperBg from "../components/CreeperBg";

const BASE = import.meta.env.BASE_URL;
const TITLECASE = (s: string) =>
  s.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

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

  const bg = `${BASE}images/overworld/${biome}-quest-bg.png`;

  // --- TIMER & SCORE (left bottom) ---
  const PREP_SECONDS = 5;
  const DURATION_SECONDS = 30;

  const [prepLeft, setPrepLeft] = React.useState(PREP_SECONDS);
  const [timeLeft, setTimeLeft] = React.useState(DURATION_SECONDS);
  const [running, setRunning] = React.useState(false);
  const [score, setScore] = React.useState(0);

  React.useEffect(() => {
    let prepInterval: number | undefined;
    let runInterval: number | undefined;

    prepInterval = window.setInterval(() => {
      setPrepLeft((p) => {
        if (p <= 1) {
          window.clearInterval(prepInterval);
          setRunning(true);
          setTimeLeft(DURATION_SECONDS);
          runInterval = window.setInterval(() => {
            setTimeLeft((t) => {
              if (t <= 1) {
                window.clearInterval(runInterval);
                setRunning(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      className="hero"
      style={{ backgroundImage: `url(${bg})`, position: "relative" }}
    >
      <CreeperBg duration="6s" />

      {/* Top-right nav */}
      <nav className="top-right-nav" style={{ zIndex: 2 }}>
        <Link className="mc-btn" to={`/study/${dimension}/${biome}`}>
          Back to Study
        </Link>
        <Link className="mc-btn" to={`/biome/${dimension}`}>
          Overworld
        </Link>
      </nav>

      {/* Layout: 2 columns → left stack (intro + score/timer), right full-height questions */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gridTemplateRows: "1fr 1fr",
          gridTemplateAreas: `
            "leftTop right"
            "leftBottom right"
          `,
          height: "100%",
          minHeight: "100svh",
        }}
      >
        {/* Left Top (Intro) */}
        <div
          style={{
            gridArea: "leftTop",
            background: "rgba(135,128,128,0.8)",
            margin: "4px",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'Press Start 2P', system-ui, sans-serif",
              fontSize: "clamp(12px, 2vw, 18px)",
              lineHeight: 1.6,
              textShadow: "1px 1px 0 #000",
              color: "#000",
            }}
          >
            THE VILLAGE IS UNDER ATTACK!
            <br />
            <br />
            ⚡ A horde of creepers is closing in on the village!
            <br />
            <br />
            🛡️ Only Harvey can save the villagers — answer 10 questions in 30
            seconds to stop the attack and earn a Netherite reward!
          </p>
        </div>

        {/* Left Bottom (Score + Timer) */}
        <div
          style={{
            gridArea: "leftBottom",
            background: "rgba(135,128,128,0.8)",
            margin: "4px",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            fontFamily: "'Press Start 2P', system-ui, sans-serif",
            color: "#000",
          }}
        >
          {/* Score */}
          <div
            style={{
              fontSize: "clamp(23px, 5vw, 33px)",
              textShadow: "2px 2px 0 #000",
            }}
          >
            Score: <b>{score}</b>/10
          </div>

          {/* Timer as a circle */}
          <div
            style={{
              width: "160px",
              height: "160px",
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

        {/* Right (Full-height Questions Panel) */}
        <div
          style={{
            gridArea: "right",
            background: "rgba(135,128,128,0.8)",
            margin: "4px",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Press Start 2P', system-ui, sans-serif",
            fontSize: "clamp(12px, 2vw, 18px)",
            color: "#000",
            textAlign: "center",
          }}
        >
          Questions will appear here (Full Right Panel)
        </div>
      </div>
    </main>
  );
}
