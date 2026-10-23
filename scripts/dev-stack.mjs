/**
 * Lance l'environnement de développement en une commande (`npm run dev:stack`) :
 * choix des apps, vérifications, pile Docker (bases, Keycloak) et migrations si
 * l'API en est, puis les apps via Turborepo. Une fois prêtes, affiche leurs
 * adresses ; Entrée les réaffiche.
 *
 * `npm run dev:stack -- --all` saute le choix et lance tout, comme le font les
 * lancements hors terminal interactif.
 *
 * Pas de `docker compose up --wait` : `keycloak-providers` et `keycloak-init`
 * s'arrêtent normalement une fois leur travail fait, ce que `--wait` compte comme
 * un échec. On attend plutôt que chaque app réponde.
 *
 * `@etape/keycloak-theme` n'est pas proposé : son serveur Vite, sans port fixé,
 * prend le 5173 du front-office, qui refuse alors de démarrer.
 */
import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";

import checkbox from "@inquirer/checkbox";

import { SIMULATEUR_BASE_PATH } from "../paths.mjs";
import { runChecks } from "./dev-stack-checks.mjs";

const READY_TIMEOUT_MS = 180_000;
const POLL_INTERVAL_MS = 2_000;
const API_WORKSPACE = "@etape/api";

/**
 * `envDir` : dossier dont le `.env` est vérifié contre son `.env.example`.
 * `needsApi` : l'app appelle l'API, qui est alors ajoutée à la sélection.
 * L'API ne répond qu'aux noms d'hôte des fronts : `host` est l'en-tête envoyé
 * pour savoir si elle répond, et son adresse affichée passe par un front.
 */
const APPS = [
  { workspace: "@etape/site", label: "Site", port: 3000, url: "http://localhost:3000" },
  {
    workspace: "@etape/simulateur",
    label: "Simulateur",
    port: 3001,
    url: `http://localhost:3001${SIMULATEUR_BASE_PATH}/`,
  },
  {
    workspace: "@etape/front-office",
    label: "Front-office",
    port: 5173,
    url: "http://localhost:5173",
    envDir: "apps/front-office",
    needsApi: true,
  },
  {
    workspace: "@etape/back-office",
    label: "Back-office",
    port: 5174,
    url: "http://localhost:5174",
    envDir: "apps/back-office",
    needsApi: true,
  },
  {
    workspace: API_WORKSPACE,
    label: "API",
    port: 3002,
    url: "http://localhost:5173/api",
    probe: "http://localhost:3002/api/auth/session",
    host: "localhost:5173",
    envDir: "apps/api",
  },
];

/**
 * Services de la pile Docker, jamais cochés : ils démarrent avec l'API, d'où la
 * raison affichée. La base ne parle pas HTTP : `tcpPort` la sonde par une simple
 * connexion.
 */
const DOCKER_SERVICES = [
  {
    label: "Base applicative",
    url: "postgresql://localhost:5432/etape",
    tcpPort: 5432,
    note: "requise par l'API · etape / etape",
  },
  {
    label: "Console Keycloak",
    url: "http://localhost:8080",
    note: "requise par l'API · admin / admin",
  },
];

/** Lance une commande et rend la main à sa fin, en échec si son code n'est pas 0. */
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} : code ${code}`)),
    );
  });
}

function isAcceptingConnections(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, "localhost", () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.setTimeout(POLL_INTERVAL_MS, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/** Toute réponse compte, redirection comprise (le simulateur en renvoie une) : seul un refus de connexion ou une 5xx n'en est pas une. */
function isResponding(service) {
  if (service.tcpPort) {
    return isAcceptingConnections(service.tcpPort);
  }
  return new Promise((resolve) => {
    const request = http.get(
      service.probe ?? service.url,
      { headers: service.host ? { host: service.host } : {} },
      (response) => {
        response.resume();
        resolve(response.statusCode < 500);
      },
    );
    request.on("error", () => resolve(false));
    request.setTimeout(POLL_INTERVAL_MS, () => request.destroy());
  });
}

/** Un seul passage sur chaque service : rend ceux qui ne répondent pas. */
async function findUnresponsive(services) {
  const checks = await Promise.all(
    services.map(async (service) => ({ service, isUp: await isResponding(service) })),
  );
  return new Set(checks.filter(({ isUp }) => !isUp).map(({ service }) => service));
}

async function waitForServices(services) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let pending = await findUnresponsive(services);
  while (pending.size > 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    pending = await findUnresponsive([...pending]);
  }
  return pending;
}

async function selectApps() {
  const isAll = process.argv.includes("--all");
  if (isAll || !process.stdin.isTTY) {
    return APPS;
  }
  try {
    const selected = await checkbox({
      message: "Apps à lancer",
      choices: APPS.map((app) => ({ name: app.label, value: app, checked: true })),
      validate: (choices) => choices.length > 0 || "Cocher au moins une app",
      theme: {
        style: {
          keysHelpTip: () => "↑↓ se déplacer · espace cocher · a tout · i inverser · ⏎ lancer",
        },
      },
    });
    const apiClients = selected.filter((app) => app.needsApi);
    const isApiMissing =
      apiClients.length > 0 && !selected.some((app) => app.workspace === API_WORKSPACE);
    if (!isApiMissing) {
      return selected;
    }
    // Non cochée mais indispensable : elle est lancée, et la bannière dit pourquoi.
    const reason = `requise par ${apiClients.map((app) => app.label).join(" et ")}`;
    console.log(`  → API ajoutée (${reason})`);
    return APPS.flatMap((app) => {
      if (app.workspace === API_WORKSPACE) {
        return [{ ...app, reason }];
      }
      return selected.includes(app) ? [app] : [];
    });
  } catch (error) {
    // Ctrl+C pendant le choix : on sort sans rien lancer.
    if (error instanceof Error && error.name === "ExitPromptError") {
      process.exit(130);
    }
    throw error;
  }
}

/** Ce qui doit s'afficher et répondre : les apps retenues, et la pile Docker avec l'API. */
function listServices(apps, needsDocker) {
  const services = apps.map((app) => {
    if (app.workspace !== API_WORKSPACE) {
      return app;
    }
    // L'adresse affichée passe par un front lancé, sinon par l'en-tête à fournir.
    // `reason` : l'API n'était pas cochée, un front l'a rendue nécessaire.
    const front = apps.find((other) => other.needsApi);
    return front
      ? { ...app, url: `${front.url}/api`, note: app.reason }
      : { ...app, url: "http://localhost:3002/api", note: `en-tête Host: ${app.host}` };
  });
  return needsDocker ? [...services, ...DOCKER_SERVICES] : services;
}

function printChecks(issues) {
  if (issues.length === 0) {
    console.log("  ✓ Vérifications : tout est en ordre.\n");
    return;
  }
  for (const issue of issues) {
    console.log(`  ${issue.isBlocking ? "✗" : "⚠"} ${issue.message}\n      → ${issue.hint}`);
  }
  console.log("");
}

function printUrls(services, pending, needsDocker) {
  const width = Math.max(...services.map((service) => service.label.length));
  const lines = services.map((service) => {
    const note = service.note ? `(${service.note})` : "";
    const status = pending.has(service) ? "✗ ne répond pas" : "";
    const details = [service.url, note, status].filter(Boolean).join("  ");
    return `  ${service.label.padEnd(width)}  ${details}`;
  });
  console.log(
    [
      "",
      "─".repeat(60),
      pending.size === 0
        ? "  ETAPE est prêt :"
        : "  ETAPE a démarré, sauf les services marqués ✗ :",
      ...lines,
      ...(needsDocker
        ? ["", "  Compte de test : test@etape.local / KEYCLOAK_TEST_USER_PASSWORD (.env)"]
        : []),
      ...(process.stdin.isTTY ? ["  Entrée : réafficher ces adresses"] : []),
      "─".repeat(60),
      "",
    ].join("\n"),
  );
}

const apps = await selectApps();
const needsDocker = apps.some((app) => app.workspace === API_WORKSPACE);

const issues = runChecks({
  ports: apps.map((app) => app.port),
  envDirs: apps.flatMap((app) => (app.envDir ? [app.envDir] : [])),
  needsDocker,
});
printChecks(issues);
if (issues.some((issue) => issue.isBlocking)) {
  console.log("  Lancement annulé : corriger les points marqués ✗, puis relancer.\n");
  process.exit(1);
}

if (needsDocker) {
  await run("docker", ["compose", "up", "-d"]);
  await run("npm", ["run", "db:deploy", `--workspace=${API_WORKSPACE}`]);
}

// Le clavier reste à ce script, pour la touche Entrée : Turborepo, en mode
// journaux, ne le transmet de toute façon pas aux apps.
const turbo = spawn("turbo", ["run", "dev", ...apps.map((app) => `--filter=${app.workspace}`)], {
  stdio: ["ignore", "inherit", "inherit"],
});
turbo.on("exit", (code) => process.exit(code ?? 0));
// Ctrl+C atteint déjà Turborepo, du même groupe de processus : on le laisse
// arrêter les apps et on sort avec lui.
process.on("SIGINT", () => {});

const services = listServices(apps, needsDocker);
printUrls(services, await waitForServices(services), needsDocker);

// Mode ligne, pas mode brut : Ctrl+C reste un signal, que le terminal envoie à
// tout le groupe. Chaque appui sur Entrée revérifie les services avant d'afficher.
// `resume()` : le choix des apps a refermé son readline, ce qui a mis le clavier
// en pause, et un écouteur seul ne le relance pas.
if (process.stdin.isTTY) {
  process.stdin.on("data", async () =>
    printUrls(services, await findUnresponsive(services), needsDocker),
  );
  process.stdin.resume();
}
