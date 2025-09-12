import * as React from "react";
import { Link } from "react-router-dom";
import McButton from "../components/McButton";

// Build the correct URL under the Vite base (e.g. "/VocabVille/")
const bg = `${import.meta.env.BASE_URL}images/home-bg.jpg`;

export default function Index() {
  return (
    <main
      className="hero min-h-dvh bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="center-wrap">
        <div className="stack">
          <h1 className="h1">Welcome Harvey to your Minecraft VocabVille</h1>

          {/* Active */}
          <McButton to="biome/overworld">Overworld</McButton>

          {/* Locked */}
          <McButton locked>The Nether</McButton>
          <McButton locked>TheEnd</McButton>

          {/* Special Stats Button */}
          <Link
            to="stats"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              marginTop: "1.5rem",
              padding: "1rem 1.25rem",
              background: "linear-gradient(135deg, #ffdd57, #ffb347)",
              border: "4px solid #1b1b1b",
              boxShadow: "0 6px 0 #7c5f00, 0 8px 0 #000",
              color: "#1b1b1b",
              fontFamily: "'Press Start 2P', system-ui, sans-serif",
              fontSize: "14px",
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "1px",
              borderRadius: "12px",
              transition: "transform 120ms ease-out, filter 120ms ease-out",
            }}
            onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
            onMouseOut={(e) => (e.currentTarget.style.filter = "none")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(3px)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <span style={{ fontSize: "20px" }}>📊</span>
            <span>View Your Stats</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
