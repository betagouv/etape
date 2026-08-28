/**
 * Assemble les exports statiques des deux apps : le site à la racine, le
 * simulateur sous son préfixe. Partagé entre les previews Vercel
 * (`scripts/vercel-out.mjs`) et le nginx du déploiement (`Dockerfile`), où le
 * découpage finirait sinon par diverger.
 *
 *   node scripts/assembler-statique.mjs <destination>
 */
import { access, cp, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SIMULATEUR_BASE_PATH } from "../paths.mjs";

const racine = process.cwd();

// Nom du sous-dossier où atterrit l'export du simulateur, dérivé du préfixe :
// "/simulateur" -> "simulateur".
const simulateurDir = SIMULATEUR_BASE_PATH.replace(/^\//, "");

/** Exports à assembler, et leur place dans l'arborescence servie. */
export const sources = [
  { from: "apps/site/out", to: "" },
  { from: "apps/simulateur/out", to: simulateurDir },
];

/**
 * Vérifie que les deux builds ont tourné **et** que le simulateur porte son
 * préfixe. Sonder la seule existence d'`index.html` laisserait passer un
 * `basePath` disparu de la config : build vert, assemblage vert, et des assets
 * en 404 une fois déployé.
 */
export async function verifierLesBuilds() {
  for (const source of sources) {
    const index = path.join(racine, source.from, "index.html");
    await access(index).catch(() => {
      throw new Error(
        `${path.relative(racine, index)} est absent. Lancer \`turbo run build\` avant ce script.`,
      );
    });
  }

  const marqueur = `${SIMULATEUR_BASE_PATH}/_next/`;
  const indexSimulateur = path.join(racine, "apps/simulateur/out/index.html");
  const html = await readFile(indexSimulateur, "utf8");
  if (!html.includes(marqueur)) {
    throw new Error(
      `Le build du simulateur ne référence pas \`${marqueur}\`.\n` +
        `   Son \`basePath\` a probablement sauté de apps/simulateur/next.config.ts :\n` +
        `   déployé tel quel, tous ses assets seraient en 404.`,
    );
  }
}

/** Recopie les exports dans `destination`, vidée au préalable. */
export async function assembler(destination) {
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });

  for (const source of sources) {
    await cp(path.join(racine, source.from), path.join(destination, source.to), {
      recursive: true,
    });
  }
}

async function main() {
  const destination = process.argv[2];
  if (!destination) {
    throw new Error("Destination manquante : node scripts/assembler-statique.mjs <destination>");
  }

  await verifierLesBuilds();
  await assembler(path.resolve(racine, destination));
  console.log(`✅ export statique assemblé dans ${destination}`);
}

// Exécuté directement, et non importé par `vercel-out.mjs`.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // `process.exit()` tronquerait les écritures en attente quand stdout est un
  // pipe : on positionne le code et on laisse Node terminer.
  main().catch((erreur) => {
    console.error(`❌ ${erreur.message}`);
    process.exitCode = 1;
  });
}
