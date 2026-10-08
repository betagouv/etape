import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Comme en production (`deploy/nginx-front-headers.inc`) : aucune page du front
 * ne s'affiche dans un cadre. Un en-tête, pas une balise `<meta>`, qui ne sait
 * pas porter `frame-ancestors`.
 */
const SECURITY_HEADERS = {
  "Content-Security-Policy": "frame-ancestors 'none'",
  "X-Frame-Options": "DENY",
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: { headers: SECURITY_HEADERS },
  server: {
    headers: SECURITY_HEADERS,
    port: 5173,
    // Un port déjà pris fait échouer Vite au lieu de le décaler en silence :
    // l'API et Keycloak attendent ce port précis (retour après connexion et
    // après déconnexion).
    strictPort: true,
    // Même origine qu'en production : le front appelle `/api`, relayé ici à
    // l'API, sans CORS. Pas de réécriture, l'API porte elle-même son préfixe.
    // `vite preview` reprend ce proxy.
    //
    // Forme objet obligatoire : la forme courte (`"/api": "http://…"`) active
    // `changeOrigin`, qui remplace l'en-tête `Host` par `localhost:3002`. Or
    // l'API reconnaît le front à cet en-tête, et répondrait 421.
    proxy: { "/api": { target: "http://localhost:3002" } },
  },
});
