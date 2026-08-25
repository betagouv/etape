import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { SIMULATEUR_BASE_PATH } from "../../paths.mjs";

const nextConfig: NextConfig = {
  // Le simulateur est servi sous un préfixe, jamais à la racine : derrière le
  // reverse proxy nginx de production comme sur les previews Vercel. Préfixe
  // routes, liens `next/link` et assets `_next/` d'un seul coup.
  basePath: SIMULATEUR_BASE_PATH,
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
  env: { NEXT_PUBLIC_BASE_PATH: SIMULATEUR_BASE_PATH },
};

// En dev, l'app est seule sur son port : la racine tombe hors du `basePath` et
// répond 404. En prod la racine appartient au site, et `output: "export"`
// ignore les `redirects` — d'où l'ajout limité à la phase `next dev`.
export default (phase: string): NextConfig =>
  phase === PHASE_DEVELOPMENT_SERVER
    ? {
        ...nextConfig,
        async redirects() {
          return [
            {
              source: "/",
              // `basePath: false` : sans lui, Next préfixerait la source
              // (`/simulateur/`) et ne verrait jamais la racine.
              destination: `${SIMULATEUR_BASE_PATH}/`,
              basePath: false,
              permanent: false,
            },
          ];
        },
      }
    : nextConfig;
