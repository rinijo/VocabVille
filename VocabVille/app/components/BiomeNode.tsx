import * as React from "react";
import { Link } from "react-router";

type Props = {
  to?: string;
  locked?: boolean;
  label: string;
};

export default function BiomeNode({ to, locked, label }: Props) {
  if (locked || !to) {
    return (
      <div className="biome-node locked" aria-disabled="true" title="Locked">
        <span className="biome-emoji">🔒</span>
        <span className="biome-label">{label}</span>
      </div>
    );
  }
  return (
    <Link to={to} className="biome-node">
      <span className="biome-emoji">🧭</span>
      <span className="biome-label">{label}</span>
    </Link>
  );
}
