import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/*
 * Importée depuis l'entrée, et non depuis `KcPage`, pour que Vite l'émette dans
 * le chunk d'entrée et que Keycloakify pose un `<link>` dans le `<head>`.
 *
 * Depuis `KcPage`, la feuille partait avec le chunk React : le squelette
 * d'`index.html` restait alors sans style jusqu'au démarrage du bundle, ce qui
 * lui retirait tout intérêt.
 */
import "./styles/theme.css";

import { KcPage } from "./kc.gen";

/*
 * Point d'entrée unique du thème. Keycloak injecte `window.kcContext` dans la
 * page FreeMarker avant de charger ce bundle ; en développement (`npm run dev`)
 * cette variable est absente, d'où le garde-fou.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {!window.kcContext ? (
      <p style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        Aucun contexte Keycloak. Lancer{" "}
        <code>npm run storybook --workspace @etape/keycloak-theme</code> pour prévisualiser les
        écrans dans un vrai Keycloak.
      </p>
    ) : (
      <KcPage kcContext={window.kcContext} />
    )}
  </StrictMode>,
);
