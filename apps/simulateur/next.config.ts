import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Génère un export 100 % statique (SSG) dans le dossier `out/`.
  output: "export",
  // Requis en export statique : pas de serveur d'optimisation d'images.
  images: { unoptimized: true },
};

export default nextConfig;
