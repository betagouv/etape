import { ANALYTICS_APP } from "@etape/analytics";
import { startRouterTracking } from "@etape/analytics/router";
import { SessionApp } from "@etape/session";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { MATOMO_CONFIG } from "./lib/analytics";
import { queryClient } from "./lib/clients";
import { router } from "./navigation/router";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Élément racine #root introuvable.");
}

startRouterTracking(router, { config: MATOMO_CONFIG, app: ANALYTICS_APP.FRONT_OFFICE });

createRoot(rootElement).render(
  <StrictMode>
    <SessionApp router={router} queryClient={queryClient} />
  </StrictMode>,
);
