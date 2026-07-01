import "@fontsource-variable/ibm-plex-sans/wght.css";
import "@fontsource-variable/noto-sans-thai/wght.css";
import "@fontsource-variable/space-grotesk/wght.css";
import "./index.css";
import "./lib/i18n.ts";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
