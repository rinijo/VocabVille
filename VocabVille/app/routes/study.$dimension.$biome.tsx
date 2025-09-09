import * as React from "react";
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { unlock } from "../utils/progress";

export async function loader({ params }: LoaderFunctionArgs) {
  return Response.json({
    dimension: (params.dimension ?? "").toLowerCase(),
    biome: (params.biome ?? "").toLowerCase(),
  }); // ✅
}

export default function StudyPage() {
  const { dimension, biome } = useLoaderData<typeof loader>();

  function done() {
    unlock(dimension, biome);
    alert(`Saved: ${dimension}/${biome} unlocked`);
  }

  return (
    <main className="center-wrap">
      <div className="stack">
        <h1 className="h1">Study: {biome.replace(/-/g, " ")}</h1>
        <div className="card">
          <p>Put your 30-word lesson/quiz here.</p>
          <div style={{ display: "grid", gap: ".5rem", marginTop: ".5rem" }}>
            <button className="mc-btn" onClick={done}>Mark Complete</button>
            <Link className="mc-btn" to="/biome/overworld">Back to Overworld</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
