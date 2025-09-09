import * as React from "react";
import { Link } from "react-router";

type Props = React.ComponentProps<typeof Link> & {
  children: React.ReactNode;
  locked?: boolean;
};

export default function McButton({ children, locked, ...rest }: Props) {
  if (locked) {
    return (
      <div
        className="mc-btn locked"
        aria-disabled="true"
        style={{
          pointerEvents: "none",
          opacity: 0.6,
          position: "relative",
        }}
      >
        🔒 {children}
      </div>
    );
  }

  return (
    <Link {...rest} className={`mc-btn ${rest.className ?? ""}`}>
      {children}
    </Link>
  );
}
