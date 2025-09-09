import * as React from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import stylesheet from "./styles.css?url"; // ✅ let the bundler resolve the URL

export function meta() {
  return [
    { charSet: "utf-8" },
    { title: "Minecraft VocabVille" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
  ];
}

export function links() {
  return [
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" },
    { rel: "stylesheet", href: stylesheet },
  ];
}

export default function Root() {
  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
