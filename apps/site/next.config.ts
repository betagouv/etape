import type { NextConfig } from "next";
import { SIMULATEUR_BASE_PATH } from "../../paths.mjs";

/**
 * URL de l'API, préfixe `/api` inclus, figée au build — l'export étant statique,
 * rien ne pourra la relire au démarrage. En production un chemin relatif suffit,
 * front et API partageant l'origine ; en développement l'API a son propre port.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3002/api" : "/api");

const nextConfig: NextConfig = {
  // Génère un export 100 % statique (SSG) dans le dossier `out/`.
  output: "export",
  // Émet `out/<route>/index.html` plutôt que `out/<route>.html`. Doit rester
  // aligné sur le simulateur, sinon la résolution des URL diffère de part et
  // d'autre de `/simulateur/` une fois les deux exports assemblés.
  trailingSlash: true,
  // Requis en export statique : pas de serveur d'optimisation d'images.
  images: { unoptimized: true },
  // Transpile le package UI partagé (source .tsx). Turbopack le fait déjà
  // automatiquement pour les packages workspace ; explicite par sécurité.
  transpilePackages: ["@etape/ui"],
  // Le simulateur est un build séparé : le site ne peut pas résoudre ses routes,
  // il a donc besoin du préfixe pour construire ses liens vers lui.
  env: {
    NEXT_PUBLIC_SIMULATEUR_PATH: SIMULATEUR_BASE_PATH,
    NEXT_PUBLIC_API_BASE_URL: API_BASE_URL,
  },
};

export default nextConfig;
