import * as React from "react";
import McButton from "../components/McButton";

export default function Index() {
  return (
    <main
      className="hero"
      style={{ backgroundImage: "url(/images/home-bg.jpg)" }}
    >
      <div className="center-wrap">
        <div className="stack">
          <h1 className="h1">Welcome Harvey to your Minecraft VocabVille</h1>

          {/* Active */}
          <McButton to="/biome/overworld">Overworld</McButton>

          {/* Locked */}
          <McButton locked>The Nether</McButton>
          <McButton locked>TheEnd</McButton>
        </div>
      </div>
    </main>
  );
}
