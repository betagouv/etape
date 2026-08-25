/**
 * Assemble les exports statiques des deux apps dans `.vercel/output/`, au format
 * attendu par la Build Output API v3 : https://vercel.com/docs/build-output-api/v3
 *
 * En mode `--prebuilt`, Vercel ne voit ni le repo ni le code — uniquement ce
 * dossier. Ni `vercel.json`, ni les réglages de build du dashboard, ni ses
 * variables d'environnement ne s'appliquent : tout se décide ici et au build.
 *
 * L'assemblage lui-même vit dans `scripts/assembler-statique.mjs`, partagé avec
 * le nginx du déploiement : seules les règles de routage propres à Vercel
 * restent ici.
 *
 * À lancer depuis la racine du monorepo, après `turbo run build`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { SIMULATEUR_BASE_PATH } from "../paths.mjs";
import { assembler, verifierLesBuilds } from "./assembler-statique.mjs";

const root = process.cwd();
const out = path.join(root, ".vercel/output");
const staticDir = path.join(out, "static");

/**
 * Tient le rôle du `vercel.json`, qui n'est pas lu en mode `--prebuilt`.
 *
 * `handle: "filesystem"` sert d'abord tout fichier existant ; `handle: "error"`
 * renvoie ensuite le 404 de la bonne app. Pas de fallback SPA : un export
 * statique Next produit un vrai fichier HTML par route, un fallback masquerait
 * les vraies 404.
 */
function construireConfig() {
  return {
    version: 3,
    routes: [
      // Ceinture et bretelles : Vercel marque déjà les previews `noindex`.
      { src: "/(.*)", headers: { "x-robots-tag": "noindex, nofollow" }, continue: true },
      // `trailingSlash: true` côté Next, mais un export statique ne peut pas
      // rediriger de lui-même : la redirection se fait donc ici.
      {
        src: `^${SIMULATEUR_BASE_PATH}$`,
        status: 308,
        headers: { Location: `${SIMULATEUR_BASE_PATH}/` },
      },
      { handle: "filesystem" },
      { handle: "error" },
      {
        src: `^${SIMULATEUR_BASE_PATH}(/.*)?$`,
        status: 404,
        dest: `${SIMULATEUR_BASE_PATH}/404.html`,
      },
      { src: "/(.*)", status: 404, dest: "/404.html" },
    ],
  };
}

async function main() {
  await verifierLesBuilds();
  await mkdir(out, { recursive: true });
  await assembler(staticDir);
  await writeFile(
    path.join(out, "config.json"),
    `${JSON.stringify(construireConfig(), null, 2)}\n`,
  );
  console.log("✅ .vercel/output prêt");
}

// `process.exit()` tronquerait les écritures encore en attente quand stdout est
// un pipe : le dev verrait le code de sortie sans le message qui l'explique.
// On se contente de positionner le code et de laisser Node terminer.
main().catch((erreur) => {
  console.error(`❌ ${erreur.message}`);
  process.exitCode = 1;
});
