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
import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, ".vercel/output");
const staticDir = path.join(out, "static");

// Reproduit le découpage de chemins de la production : le site à la racine,
// le simulateur sous son préfixe.
const sources = [
  { from: "apps/site/out", to: "" },
  { from: "apps/simulateur/out", to: "simulateur" },
];

// Garde-fou : attrape le cas où l'un des deux builds n'a pas tourné, plutôt que
// de déployer une preview amputée d'une app.
for (const source of sources) {
  const probe = path.join(root, source.from, "index.html");
  await access(probe).catch(() => {
    console.error(`❌ Manquant : ${path.relative(root, probe)}`);
    console.error("   Lancer `turbo run build` avant ce script.");
    process.exit(1);
  });
}

await rm(staticDir, { recursive: true, force: true });
await mkdir(staticDir, { recursive: true });
for (const source of sources) {
  await cp(path.join(root, source.from), path.join(staticDir, source.to), { recursive: true });
}

// Tient le rôle du `vercel.json`, qui n'est pas lu en mode `--prebuilt`.
// `handle: "filesystem"` sert d'abord tout fichier existant ; `handle: "error"`
// renvoie ensuite le 404 de la bonne app. Pas de fallback SPA : un export
// statique Next produit un vrai fichier HTML par route, un fallback masquerait
// les vraies 404.
const config = {
  version: 3,
  routes: [
    // Ceinture et bretelles : Vercel marque déjà les previews `noindex`.
    { src: "/(.*)", headers: { "x-robots-tag": "noindex, nofollow" }, continue: true },
    // `trailingSlash: true` côté Next, mais un export statique ne peut pas
    // rediriger de lui-même : la redirection se fait donc ici.
    { src: "^/simulateur$", status: 308, headers: { Location: "/simulateur/" } },
    { handle: "filesystem" },
    { handle: "error" },
    { src: "^/simulateur(/.*)?$", status: 404, dest: "/simulateur/404.html" },
    { src: "/(.*)", status: 404, dest: "/404.html" },
  ],
};

await writeFile(path.join(out, "config.json"), `${JSON.stringify(config, null, 2)}\n`);

console.log("✅ .vercel/output prêt");
