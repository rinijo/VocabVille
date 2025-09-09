import * as React from "react";
import { isRouteErrorResponse, Link, useLoaderData, useRouteError, json, type LoaderFunctionArgs } from "react-router";

type DimensionKey = "overworld" | "nether" | "the-end";

const DIMENSIONS: Record<DimensionKey, {
  label: string;
  badgeClass: string;
  bg: string;         // optional different background per dimension
  blurb: string;
}> = {
  overworld: {
    label: "Overworld",
    badgeClass: "badge badge--overworld",
    bg: "/images/home-bg.jpg",
    blurb: "Lush forests, plains, caves… Learn everyday words and friendly mobs of vocabulary here.",
  },
  nether: {
    label: "The Nether",
    badgeClass: "badge badge--nether",
    bg: "/images/home-bg.jpg",
    blurb: "Fiery challenges! Hot, tricky words and spicy synonyms to forge your skills.",
  },
  "the-end": {
    label: "The End",
    badgeClass: "badge badge--theend",
    bg: "/images/home-bg.jpg",
    blurb: "Mysterious islands and Endermen… master rare, high-level vocabulary here.",
  },
};

export async function loader({ params }: LoaderFunctionArgs) {
  const dimension = (params.dimension ?? "").toLowerCase() as DimensionKey;
  if (!Object.hasOwn(DIMENSIONS, dimension)) {
    throw json({ message: "Unknown dimension" }, { status: 404 });
  }
  return json({ dimension, config: DIMENSIONS[dimension] });
}

export default function BiomePage() {
  const { dimension, config } = useLoaderData<typeof loader>();

  return (
    <main
      className="hero"
      style={{ backgroundImage: `url(${config.bg})` }}
    >
      <div className="center-wrap">
        <div className="stack">
          <span className={config.badgeClass}>{config.label}</span>

          <div className="card">
            <h2>{config.label} Biome</h2>
            <p style={{ lineHeight: 1.6 }}>{config.blurb}</p>

            {/* Example navigation inside the single page: tabs or sub-sections would go here */}
            <div style={{ marginTop: "1rem", display: "grid", gap: ".5rem" }}>
              <Link className="mc-btn" to="/biome/overworld">Go to Overworld</Link>
              <Link className="mc-btn" to="/biome/nether">Go to The Nether</Link>
              <Link className="mc-btn" to="/biome/the-end">Go to TheEnd</Link>
              <Link className="mc-btn" to="/">Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export function ErrorBoundary() {
  const err = useRouteError();
  if (isRouteErrorResponse(err) && err.status === 404) {
    return (
      <main className="center-wrap">
        <div className="stack">
          <h1 className="h1">Dimension not found</h1>
          <Link className="mc-btn" to="/">Back to Home</Link>
        </div>
      </main>
    );
  }
  return (
    <main className="center-wrap">
      <div className="stack">
        <h1 className="h1">Something went wrong</h1>
        <Link className="mc-btn" to="/">Back to Home</Link>
      </div>
    </main>
  );
}
