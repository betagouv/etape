/**
 * Assemble les exports dans `.vercel/output/`, au format de la Build Output API
 * v3 : https://vercel.com/docs/build-output-api/v3
 *
 * En `--prebuilt`, Vercel ne voit que ce dossier : ni `vercel.json`, ni les
 * réglages du dashboard, ni ses variables ne s'appliquent. L'assemblage vit dans
 * `assembler-statique.mjs`, partagé avec le nginx du déploiement.
 *
 * À lancer depuis la racine, après `turbo run build`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { SIMULATEUR_BASE_PATH } from "../paths.mjs";
import { assembler, verifierLesBuilds } from "./assembler-statique.mjs";

const root = process.cwd();
const out = path.join(root, ".vercel/output");
const staticDir = path.join(out, "static");

/**
 * Tient le rôle du `vercel.json`, non lu en `--prebuilt`. Pas de fallback SPA :
 * un export statique Next produit un vrai fichier par route, et un fallback
 * masquerait les vraies 404.
 */
function construireConfig() {
  return {
    version: 3,
    routes: [
      { src: "/(.*)", headers: { "x-robots-tag": "noindex, nofollow" }, continue: true },
      // `trailingSlash: true` côté Next, qu'un export statique ne sait pas
      // appliquer lui-même.
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

// `process.exit()` tronquerait les écritures en attente quand stdout est un
// pipe : on positionne le code et on laisse Node terminer.
main().catch((erreur) => {
  console.error(`❌ ${erreur.message}`);
  process.exitCode = 1;
});
