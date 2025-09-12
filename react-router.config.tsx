// react-router.config.tsx
import React from "react";
import App from "./App";        // your top-level layout
import routes from "./routes";  // children routes

// Root route: everything is nested under <App />
export default [
  {
    path: "/",
    element: <App />,
    children: routes,
  },
];
