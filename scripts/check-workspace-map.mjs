/**
 * Vérifie que la cartographie des workspaces suit le dépôt.
 *
 * Pour chaque dossier de `apps/*` et `packages/*` qui contient un
 * `package.json` :
 * - un `AGENTS.md` existe et dit autre chose que le bloc généré par `next dev` ;
 * - un `CLAUDE.md` existe et importe `@AGENTS.md` ;
 * - `docs/cartographie.md` le cite.
 * Et dans l'autre sens : la cartographie ne cite aucun workspace disparu.
 *
 * Sans ce contrôle, un workspace ajouté sans fichier d'agent ni ligne dans la
 * cartographie redevient invisible pour les agents, et personne ne s'en aperçoit.
 *
 * À lancer depuis la racine du monorepo : `npm run check:workspace-map`.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const MAP_PATH = "docs/cartographie.md";
const WORKSPACE_PARENTS = ["apps", "packages"];
const NEXT_BLOCK = /<!-- BEGIN:nextjs-agent-rules -->[\s\S]*?<!-- END:nextjs-agent-rules -->/;
const AGENTS_IMPORT = "@AGENTS.md";
// Un chemin de workspace cité entre backticks : `apps/site`, `packages/ui/src/…`.
const CITED_WORKSPACE = /`((?:apps|packages)\/[a-z0-9-]+)/g;

/**
 * @param {string} relativePath
 * @returns {Promise<string | undefined>}
 */
async function readOptional(relativePath) {
  try {
    return await readFile(path.join(root, relativePath), "utf8");
  } catch {
    return undefined;
  }
}

/** @returns {Promise<string[]>} */
async function listWorkspaces() {
  const workspaces = [];
  for (const parent of WORKSPACE_PARENTS) {
    const entries = await readdir(path.join(root, parent), { withFileTypes: true });
    for (const entry of entries) {
      const workspace = `${parent}/${entry.name}`;
      if (entry.isDirectory() && (await readOptional(`${workspace}/package.json`))) {
        workspaces.push(workspace);
      }
    }
  }
  return workspaces.sort();
}

/**
 * @param {string} workspace
 * @param {string} map
 * @returns {Promise<string[]>}
 */
async function checkWorkspace(workspace, map) {
  const problems = [];

  const agents = await readOptional(`${workspace}/AGENTS.md`);
  if (agents === undefined) {
    problems.push(`${workspace} : AGENTS.md manquant`);
  } else if (agents.replace(NEXT_BLOCK, "").trim() === "") {
    problems.push(`${workspace} : AGENTS.md ne contient que le bloc généré par next dev`);
  }

  const claude = await readOptional(`${workspace}/CLAUDE.md`);
  if (claude === undefined) {
    problems.push(`${workspace} : CLAUDE.md manquant`);
  } else if (!claude.includes(AGENTS_IMPORT)) {
    problems.push(`${workspace} : CLAUDE.md n'importe pas ${AGENTS_IMPORT}`);
  }

  if (!map.includes(`\`${workspace}`)) {
    problems.push(`${workspace} : absent de ${MAP_PATH}`);
  }

  return problems;
}

const map = await readOptional(MAP_PATH);
if (map === undefined) {
  console.error(`${MAP_PATH} introuvable.`);
  process.exit(1);
}

const workspaces = await listWorkspaces();
const problems = [];
for (const workspace of workspaces) {
  problems.push(...(await checkWorkspace(workspace, map)));
}

const citedWorkspaces = new Set([...map.matchAll(CITED_WORKSPACE)].map((match) => match[1]));
for (const cited of citedWorkspaces) {
  if (!workspaces.includes(cited)) {
    problems.push(`${MAP_PATH} cite ${cited}, qui n'est pas un workspace`);
  }
}

if (problems.length > 0) {
  console.error("Cartographie des workspaces à mettre à jour :\n");
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  console.error(`\nVoir ${MAP_PATH}, section « Tenir cette cartographie à jour ».`);
  process.exit(1);
}

console.log(`Cartographie à jour : ${workspaces.length} workspaces.`);
