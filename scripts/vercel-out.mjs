/**
 * Assemble les exports statiques des deux apps dans `.vercel/output/`, au format
 * attendu par la Build Output API v3 : https://vercel.com/docs/build-output-api/v3
 *
 * En mode `--prebuilt`, Vercel ne voit ni le repo ni le code — uniquement ce
 * dossier. Ni `vercel.json`, ni les réglages de build du dashboard, ni ses
 * variables d'environnement ne s'appliquent : tout se décide ici et au build.
 *
 * À lancer depuis la racine du monorepo, après `turbo run build`.
 */
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { SIMULATEUR_BASE_PATH } from "../paths.mjs";

const root = process.cwd();
const out = path.join(root, ".vercel/output");
const staticDir = path.join(out, "static");

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
  await assembler();
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
