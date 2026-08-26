/**
 * Assemble les exports statiques des deux apps dans `dist/preview/`, prêt à
 * être rsyncé tel quel vers la VM de previews (DEBFCOETAPFRT01), où nginx
 * applique les règles de routage (voir docs/infra/nginx-previews.conf).
 *
 * Successeur de `scripts/vercel-out.mjs` (previews Vercel, dispositif
 * transitoire) : l'assemblage et les garde-fous sont identiques, seul le
 * `config.json` Vercel disparaît — ses règles (noindex, 308 sur le préfixe,
 * 404 par app) vivent désormais dans la conf nginx.
 *
 * À lancer depuis la racine du monorepo, après `turbo run build`.
 */
import { access, cp, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

import { SIMULATEUR_BASE_PATH } from "../paths.mjs";

const root = process.cwd();
const staticDir = path.join(root, "dist/preview");

// Nom du sous-dossier où atterrit l'export du simulateur, dérivé du préfixe :
// "/simulateur" -> "simulateur".
const simulateurDir = SIMULATEUR_BASE_PATH.replace(/^\//, "");

// Reproduit le découpage de chemins de la production : le site à la racine,
// le simulateur sous son préfixe.
const sources = [
  { from: "apps/site/out", to: "" },
  { from: "apps/simulateur/out", to: simulateurDir },
];

/**
 * Vérifie que les deux builds ont tourné **et** que le simulateur porte bien son
 * préfixe.
 *
 * Sonder la seule existence de `index.html` laisserait passer le mode de
 * défaillance le plus coûteux : un `basePath` disparu de la config. Le build
 * reste vert, l'assemblage aussi, et la casse ne se voit qu'une fois la preview
 * déployée, sous forme d'assets en 404.
 */
async function verifierLesBuilds() {
  for (const source of sources) {
    const index = path.join(root, source.from, "index.html");
    await access(index).catch(() => {
      throw new Error(
        `${path.relative(root, index)} est absent. Lancer \`turbo run build\` avant ce script.`,
      );
    });
  }

  const marqueur = `${SIMULATEUR_BASE_PATH}/_next/`;
  const indexSimulateur = path.join(root, "apps/simulateur/out/index.html");
  const html = await readFile(indexSimulateur, "utf8");
  if (!html.includes(marqueur)) {
    throw new Error(
      `Le build du simulateur ne référence pas \`${marqueur}\`.\n` +
        `   Son \`basePath\` a probablement sauté de apps/simulateur/next.config.ts :\n` +
        `   déployé tel quel, tous ses assets seraient en 404.`,
    );
  }
}

async function assembler() {
  await rm(staticDir, { recursive: true, force: true });
  await mkdir(staticDir, { recursive: true });
  for (const source of sources) {
    await cp(path.join(root, source.from), path.join(staticDir, source.to), { recursive: true });
  }
}

async function main() {
  await verifierLesBuilds();
  await assembler();
  console.log(`✅ ${path.relative(root, staticDir)} prêt à être déployé`);
}

// `process.exit()` tronquerait les écritures encore en attente quand stdout est
// un pipe : le dev verrait le code de sortie sans le message qui l'explique.
// On se contente de positionner le code et de laisser Node terminer.
main().catch((erreur) => {
  console.error(`❌ ${erreur.message}`);
  process.exitCode = 1;
});
