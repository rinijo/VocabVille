import * as React from "react";
import McButton from "../components/McButton";

export default function Index() {
  return (
    <main
      className="hero"
      style={{ backgroundImage: "url(/images/home-bg.jpg)" }} /* <-- swap for your image */
    >
      <div className="center-wrap">
        <div className="stack">
          <h1 className="h1">Welcome Harvey to your Minecraft VocabVille</h1>

          <McButton to="/biome/overworld">Overworld</McButton>
          <McButton to="/biome/nether">The Nether</McButton>
          <McButton to="/biome/the-end">TheEnd</McButton>
        </div>
      </div>
    </main>
  );
}
