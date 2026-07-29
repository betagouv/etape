import type { NextConfig } from "next";

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
};

export default nextConfig;
