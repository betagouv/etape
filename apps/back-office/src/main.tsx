import { SessionApp } from "@etape/session";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { queryClient } from "./lib/clients";
import { router } from "./navigation/router";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Élément racine #root introuvable.");
}

createRoot(rootElement).render(
  <StrictMode>
    <SessionApp router={router} queryClient={queryClient} />
  </StrictMode>,
);
