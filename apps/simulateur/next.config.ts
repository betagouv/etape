import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Génère un export 100 % statique (SSG) dans le dossier `out/`.
  output: "export",
  // Requis en export statique : pas de serveur d'optimisation d'images.
  images: { unoptimized: true },
  // Transpile le package UI partagé (source .tsx). Turbopack le fait déjà
  // automatiquement pour les packages workspace ; explicite par sécurité.
  transpilePackages: ["@etape/ui"],
};

export default nextConfig;
