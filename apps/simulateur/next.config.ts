import type { NextConfig } from "next";

// Le simulateur est servi sous un préfixe de chemin, jamais à la racine :
// derrière le reverse proxy nginx de production comme sur les previews Vercel.
// Sans slash final (convention `basePath` de Next).
const basePath = "/simulateur";

const nextConfig: NextConfig = {
  // Préfixe routes, liens `next/link` et assets `_next/` d'un seul coup.
  basePath,
  // Génère un export 100 % statique (SSG) dans le dossier `out/`.
  output: "export",
  // Émet `out/<route>/index.html` plutôt que `out/<route>.html` : servi tel quel
  // par n'importe quel hébergeur statique, sans règle de réécriture.
  trailingSlash: true,
  // Requis en export statique : pas de serveur d'optimisation d'images.
  images: { unoptimized: true },
  // Transpile le package UI partagé (source .tsx). Turbopack le fait déjà
  // automatiquement pour les packages workspace ; explicite par sécurité.
  transpilePackages: ["@etape/ui"],
  // `basePath` ne préfixe pas le `src` de `next/image` ni les URL écrites à la
  // main vers `public/` : on l'expose pour les dériver au lieu de les dupliquer.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
