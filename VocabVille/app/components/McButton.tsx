import * as React from "react";
import { Link } from "react-router";

// Infer props from Link so types always match the library
type Props = React.ComponentProps<typeof Link> & { children: React.ReactNode };

export default function McButton({ children, ...rest }: Props) {
  return (
    <Link {...rest} className={`mc-btn ${rest.className ?? ""}`}>
      {children}
    </Link>
  );
}
