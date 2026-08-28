import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Importée depuis l'entrée et non depuis `KcPage`, pour que Keycloakify pose un
// `<link>` dans le `<head>` : sinon la feuille part avec le chunk React et le
// squelette d'`index.html` reste sans style jusqu'au démarrage du bundle.
import "./styles/theme.css";

import { KcPage } from "./kc.gen";

// Keycloak injecte `window.kcContext` dans la page FreeMarker avant de charger
// ce bundle ; en développement elle est absente, d'où le garde-fou.
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
