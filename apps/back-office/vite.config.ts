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

/**
 * Noms d'hôte publics de `pnpm run dev:tunnel`, séparés par des virgules. Vite
 * ne répond qu'à `localhost` et aux adresses IP (protection contre le DNS
 * rebinding) : sans eux, les URL du tunnel afficheraient « Blocked request ».
 * Vide hors de ce mode, et la protection reste entière.
 */
const TUNNEL_HOSTS = process.env.ETAPE_TUNNEL_HOSTS?.split(",").filter(Boolean) ?? [];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Le tunnel vise ce port précis : décalé, il aboutirait dans le vide.
  preview: { headers: SECURITY_HEADERS, allowedHosts: TUNNEL_HOSTS, strictPort: true },
  server: {
    headers: SECURITY_HEADERS,
    allowedHosts: TUNNEL_HOSTS,
    port: 5174,
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
