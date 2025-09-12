import * as React from "react";
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
        </div>
      </div>
    </main>
  );
}
