import * as React from "react";
import {
  isRouteErrorResponse,
  Link,
  useLoaderData,
  useRouteError,
  type LoaderFunctionArgs,
} from "react-router";
import BiomeMapOverworld from "../components/BiomeMap";

type DimensionKey = "overworld" | "nether" | "the-end";

const DIMENSIONS: Record<
  DimensionKey,
  { label: string; badgeClass: string; bg: string; blurb: string }
> = {
  overworld: {
    label: "Overworld",
    badgeClass: "badge badge--overworld",
    bg: "/images/home-bg.jpg",
    blurb:
      "Pick a biome to start learning. Unlock more biomes as you master words!",
  },
  nether: {
    label: "The Nether",
    badgeClass: "badge badge--nether",
    bg: "/images/home-bg.jpg",
    blurb: "Locked for now.",
  },
  "the-end": {
    label: "The End",
    badgeClass: "badge badge--theend",
    bg: "/images/home-bg.jpg",
    blurb: "Locked for now.",
  },
};

export async function loader({ params }: LoaderFunctionArgs) {
  const dimension = (params.dimension ?? "").toLowerCase() as DimensionKey;

  if (!Object.hasOwn(DIMENSIONS, dimension)) {
    throw new Response(JSON.stringify({ message: "Unknown dimension" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return Response.json({ dimension, config: DIMENSIONS[dimension] });
}

export default function BiomePage() {
  const { dimension, config } = useLoaderData<typeof loader>();

  return (
    <main className="hero" style={{ backgroundImage: `url(${config.bg})` }}>
      {/* TOP-RIGHT NAV */}
      <nav className="top-right-nav">
        <Link className="mc-btn" to="/">Back to Home</Link>
      </nav>

      <div className="center-wrap">
        <div className="stack">
          <span className={config.badgeClass}>{config.label}</span>

          <div className="card">
            <h2>{config.label} Biome</h2>
            <p style={{ lineHeight: 1.6 }}>{config.blurb}</p>

            {dimension === "overworld" ? (
              <BiomeMapOverworld />
            ) : (
              <div style={{ display: "grid", gap: ".5rem", marginTop: "1rem" }}>
                <div className="biome-grid">
                  <div className="biome-node locked" aria-disabled="true">
                    <span className="biome-emoji">🔒</span>
                    <span className="biome-label">Coming soon</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export function ErrorBoundary() {
  const err = useRouteError();
  if (isRouteErrorResponse(err) && err.status === 404) {
    let msg: string | undefined;
    try {
      if (typeof err.data === "string") msg = err.data;
      else if (err.data && typeof err.data === "object" && "message" in err.data)
        msg = (err.data as any).message;
    } catch {}
    return (
      <main className="center-wrap">
        <div className="stack">
          <h1 className="h1">Dimension not found</h1>
          {msg ? <p>{msg}</p> : null}
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
