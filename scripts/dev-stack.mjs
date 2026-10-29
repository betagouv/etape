/**
 * Lance l'environnement de développement en une commande (`pnpm run dev:stack`) :
 * choix des apps, vérifications, pile Docker (bases, Keycloak) et migrations si
 * l'API en est, puis les apps via Turborepo. Une fois prêtes, affiche leurs
 * adresses dans un tableau (`dev-stack-table.mjs`) ; Entrée le rafraîchit.
 *
 * `pnpm run dev:stack --all` saute le choix et lance tout, comme le font les
 * lancements hors terminal interactif.
 *
 * `pnpm run dev:tunnel` (`--tunnel`) ouvre le front-office, le back-office et
 * Keycloak sur des URL publiques, pour une session de test avec les PO : apps
 * construites puis servies par `start` (le serveur de dev de Vite est trop lent
 * à travers un tunnel), Keycloak derrière sa garde. Voir `dev-tunnel.mjs`.
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
import https from "node:https";
import net from "node:net";

import checkbox from "@inquirer/checkbox";

import { SIMULATEUR_BASE_PATH } from "../paths.mjs";
import { runChecks } from "./dev-stack-checks.mjs";
import { renderTable, ROW_STATE } from "./dev-stack-table.mjs";
import {
  copyToClipboard,
  formatTesterMessage,
  restoreLocalKeycloak,
  startTunnels,
} from "./dev-tunnel.mjs";

const READY_TIMEOUT_MS = 180_000;
const POLL_INTERVAL_MS = 2_000;
const PROGRESS_INTERVAL_MS = 10_000;
const API_WORKSPACE = "@etape/api";
const API_PORT = 3002;
const FRONT_OFFICE_WORKSPACE = "@etape/front-office";
const BACK_OFFICE_WORKSPACE = "@etape/back-office";

/**
 * L'API n'émet jamais de 421 que pour un hôte qu'elle ne connaît pas : dans ce
 * cas elle répond, mais aucun appel du front n'aboutira.
 */
const MISDIRECTED_STATUS = 421;

const isTunnel = process.argv.includes("--tunnel");

/** Sections du tableau final. */
const SECTION = {
  APPS: "Apps",
  DOCKER: "Pile Docker",
  TESTERS: "Pour les PO",
  DEVELOPER: "Pour toi",
};

/** Saisie qui, suivie d'Entrée, recopie le message des PO au lieu de rafraîchir. */
const COPY_COMMAND = "c";

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
    workspace: FRONT_OFFICE_WORKSPACE,
    label: "Front-office",
    port: 5173,
    url: "http://localhost:5173",
    envDir: "apps/front-office",
    needsApi: true,
  },
  {
    workspace: BACK_OFFICE_WORKSPACE,
    label: "Back-office",
    port: 5174,
    url: "http://localhost:5174",
    envDir: "apps/back-office",
    needsApi: true,
  },
  {
    workspace: API_WORKSPACE,
    label: "API",
    port: API_PORT,
    url: "http://localhost:5173/api",
    probe: `http://localhost:${API_PORT}/api/auth/session`,
    host: "localhost:5173",
    envDir: "apps/api",
  },
];

/**
 * Services de la pile Docker, jamais cochés : ils démarrent avec l'API. La base
 * ne parle pas HTTP : `tcpPort` la sonde par une simple connexion.
 */
const DOCKER_SERVICES = [
  {
    label: "Base",
    url: "postgresql://localhost:5432/etape",
    details: "etape / etape",
    tcpPort: 5432,
  },
  { label: "Console Keycloak", url: "http://localhost:8080", details: "admin / admin" },
];

/**
 * Lignes d'information du tableau : rien à sonder. `display` remplace l'adresse
 * d'un service quand elle n'est pas ce qui sert à le lire.
 */
const TEST_ACCOUNT = {
  label: "Compte de test",
  display: "test@etape.local · KEYCLOAK_TEST_USER_PASSWORD (.env)",
  isInfo: true,
};

/** Lance une commande et rend la main à sa fin, en échec si son code n'est pas 0. */
function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env });
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

/**
 * Toute réponse compte, redirection comprise (le simulateur en renvoie une) :
 * seuls un refus de connexion, une 5xx ou la 421 d'un hôte inconnu de l'API n'en
 * sont pas une.
 */
function isResponding(service) {
  if (service.tcpPort) {
    return isAcceptingConnections(service.tcpPort);
  }
  const target = service.probe ?? service.url;
  const client = target.startsWith("https:") ? https : http;
  return new Promise((resolve) => {
    const request = client.get(
      target,
      { headers: service.host ? { host: service.host } : {} },
      (response) => {
        response.resume();
        resolve(response.statusCode < 500 && response.statusCode !== MISDIRECTED_STATUS);
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

/**
 * Attend que chaque service réponde, en disant qui manque encore. Une ligne
 * toutes les `PROGRESS_INTERVAL_MS` plutôt qu'une animation : les journaux des
 * apps s'écrivent dans le même terminal, et une ligne réécrite sur place y
 * serait hachée.
 */
async function waitForServices(services) {
  const startedAt = Date.now();
  const deadline = startedAt + READY_TIMEOUT_MS;
  let lastProgressAt = 0;
  let pending = await findUnresponsive(services);
  while (pending.size > 0 && Date.now() < deadline) {
    if (Date.now() - lastProgressAt >= PROGRESS_INTERVAL_MS) {
      lastProgressAt = Date.now();
      const labels = [...pending].map((service) => service.label).join(", ");
      const elapsedSeconds = Math.round((lastProgressAt - startedAt) / 1000);
      console.log(`  ⏳ En attente de : ${labels} (${elapsedSeconds} s)`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    pending = await findUnresponsive([...pending]);
  }
  return pending;
}

async function selectApps() {
  // Le tunnel ne sert qu'à l'authentification : les deux fronts et leur API.
  if (isTunnel) {
    return APPS.filter((app) => app.needsApi || app.workspace === API_WORKSPACE);
  }
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
      return { ...app, section: SECTION.APPS };
    }
    // L'adresse affichée passe par un front lancé, sinon par l'en-tête à fournir.
    // `reason` : l'API n'était pas cochée, un front l'a rendue nécessaire.
    const front = apps.find((other) => other.needsApi);
    return front
      ? { ...app, section: SECTION.APPS, url: `${front.url}/api`, details: app.reason }
      : {
          ...app,
          section: SECTION.APPS,
          url: `http://localhost:${API_PORT}/api`,
          details: `en-tête Host: ${app.host}`,
        };
  });
  if (!needsDocker) {
    return services;
  }
  const dockerRows = [...DOCKER_SERVICES, TEST_ACCOUNT].map((service) => ({
    ...service,
    section: SECTION.DOCKER,
  }));
  return [...services, ...dockerRows];
}

/**
 * En mode tunnel, tout se sonde par les URL publiques : une réponse prouve la
 * chaîne entière, tunnel, garde et réglages d'hôte compris.
 */
function listTunnelServices(urls) {
  const [database, keycloakConsole] = DOCKER_SERVICES;
  return [
    { section: SECTION.TESTERS, label: "Front-office", url: urls.frontOffice },
    { section: SECTION.TESTERS, label: "Back-office", url: urls.backOffice },
    {
      section: SECTION.TESTERS,
      label: "Compte de test",
      display: "test@etape.local · mot de passe à transmettre à part",
      isInfo: true,
    },
    // Leurs adresses ne servent qu'aux fronts et au navigateur : elles ne
    // s'affichent que si la sonde échoue, pour dire où elle a échoué.
    //
    // L'API se sonde en direct, sous le nom public du front-office, et non à
    // travers son proxy : Vite est prêt bien avant Nest, et chaque sonde arrivée
    // trop tôt lui ferait écrire une « http proxy error » qui n'en est pas une.
    // Le nom suffit à vérifier que l'API a reçu les URL du tunnel (sinon, 421) ;
    // le tunnel du front-office, lui, est prouvé par sa propre ligne.
    {
      section: SECTION.DEVELOPER,
      label: "API",
      url: `http://localhost:${API_PORT}/api`,
      probe: `http://localhost:${API_PORT}/api/auth/session`,
      host: new URL(urls.frontOffice).host,
      display: "relayée par chaque front (/api)",
    },
    {
      section: SECTION.DEVELOPER,
      label: "Keycloak",
      url: urls.keycloak,
      probe: `${urls.keycloak}/realms/etape/.well-known/openid-configuration`,
      display: `console ${keycloakConsole.url} · ${keycloakConsole.details}`,
    },
    { ...database, section: SECTION.DEVELOPER },
  ];
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

function formatDuration(milliseconds) {
  const seconds = Math.round(milliseconds / 1000);
  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}

function formatClock(date) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Une ligne par service, groupées par section dans l'ordre de leur première apparition. */
function buildSections(services, pending) {
  const sections = new Map();
  for (const service of services) {
    const rows = sections.get(service.section) ?? [];
    rows.push(toRow(service, pending));
    sections.set(service.section, rows);
  }
  return [...sections].map(([title, rows]) => ({ title, rows }));
}

function toRow(service, pending) {
  if (service.isInfo) {
    return { state: ROW_STATE.INFO, label: service.label, value: service.display };
  }
  if (pending.has(service)) {
    return {
      state: ROW_STATE.DOWN,
      label: service.label,
      value: `${service.probe ?? service.url} · ne répond pas`,
    };
  }
  return {
    state: ROW_STATE.UP,
    label: service.label,
    value: service.display ?? [service.url, service.details].filter(Boolean).join(" · "),
  };
}

/**
 * `isRefresh` : appel par la touche Entrée. Le titre donne alors l'heure plutôt
 * que la durée du lancement.
 */
function formatHeadline(pending, isRefresh) {
  if (isRefresh) {
    return `  État à ${formatClock(new Date())}`;
  }
  const duration = formatDuration(Date.now() - launchedAt);
  if (pending.size > 0) {
    return `  ⚠ ETAPE a démarré en ${duration}, sauf les lignes marquées ✗`;
  }
  return isTunnel
    ? `  ✓ Session de test ouverte · prête en ${duration}`
    : `  ✓ ETAPE est prêt · ${duration}`;
}

function formatShortcuts() {
  if (!process.stdin.isTTY) {
    return [];
  }
  return isTunnel
    ? [`  Entrée : rafraîchir · ${COPY_COMMAND} + Entrée : recopier · Ctrl+C : fermer la session`]
    : ["  Entrée : rafraîchir · Ctrl+C : arrêter"];
}

/**
 * Le message des PO n'est copié qu'au premier affichage : un rafraîchissement ne
 * doit pas écraser ce que le dev a mis entre-temps dans son presse-papier. Si la
 * copie échoue, il s'affiche sous le tableau.
 */
async function formatTesterNotice(isRefresh) {
  if (!tunnel || isRefresh) {
    return [];
  }
  const message = formatTesterMessage(tunnel.urls);
  if (await copyToClipboard(message)) {
    return ["  Message pour les PO copié dans le presse-papier."];
  }
  return [
    "  Message pour les PO, à copier :",
    "",
    ...message.split("\n").map((line) => `    ${line}`),
  ];
}

async function report(pending, isRefresh = false) {
  console.log(
    [
      "",
      formatHeadline(pending, isRefresh),
      "",
      renderTable(buildSections(services, pending), process.stdout.columns),
      ...(await formatTesterNotice(isRefresh)),
      ...formatShortcuts(),
      "",
    ].join("\n"),
  );
}

async function copyTesterMessage() {
  const isCopied = await copyToClipboard(formatTesterMessage(tunnel.urls));
  console.log(
    isCopied
      ? "  ✓ Message pour les PO recopié dans le presse-papier.\n"
      : "  ✗ Copie impossible : le message est affiché au lancement.\n",
  );
}

/** Ouvre les tunnels, ou arrête le lancement en disant pourquoi. */
async function openTunnels() {
  console.log("  Ouverture des tunnels (front-office, back-office, Keycloak)…\n");
  try {
    const tunnel = await startTunnels({
      frontOfficePort: APPS.find((app) => app.workspace === FRONT_OFFICE_WORKSPACE).port,
      backOfficePort: APPS.find((app) => app.workspace === BACK_OFFICE_WORKSPACE).port,
    });
    // Sortie normale, Ctrl+C ou erreur : les URL publiques ne survivent pas au
    // script, et les realms ne doivent pas continuer à renvoyer vers elles —
    // un `pnpm run dev` lancé ensuite enverrait la connexion dans le vide.
    process.on("exit", () => {
      tunnel.close();
      console.log("\n  Session fermée : tunnels coupés, Keycloak remis sur localhost.");
      if (!restoreLocalKeycloak()) {
        console.log("  ✗ Keycloak non remis sur localhost : `docker compose up -d keycloak-init`.");
      }
    });
    return tunnel;
  } catch (error) {
    console.log(`  ✗ ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  }
}

const apps = await selectApps();
// Après le choix des apps : la durée affichée est celle du démarrage, pas de la saisie.
const launchedAt = Date.now();
const needsDocker = apps.some((app) => app.workspace === API_WORKSPACE);

const issues = runChecks({
  ports: apps.map((app) => app.port),
  envDirs: apps.flatMap((app) => (app.envDir ? [app.envDir] : [])),
  needsDocker,
  needsTunnel: isTunnel,
});
printChecks(issues);
if (issues.some((issue) => issue.isBlocking)) {
  console.log("  Lancement annulé : corriger les points marqués ✗, puis relancer.\n");
  process.exit(1);
}

const filters = apps.map((app) => `--filter=${app.workspace}`);

// Construites avant l'ouverture des tunnels : les URL publiques ne servent qu'à
// l'exécution, et un build en échec ne doit rien avoir exposé.
if (isTunnel) {
  await run("turbo", ["run", "build", ...filters]);
}
const tunnel = isTunnel ? await openTunnels() : undefined;
// Jusqu'au lancement de Turborepo, Ctrl+C tuerait le script sans émettre `exit` :
// les realms garderaient l'URL d'un tunnel déjà fermé. On sort donc proprement.
const exitOnInterrupt = () => process.exit(130);
process.on("SIGINT", exitOnInterrupt);
const stackEnv = { ...process.env, ...tunnel?.env };

if (needsDocker) {
  await run("docker", ["compose", "up", "-d"], stackEnv);
  await run("pnpm", ["--filter", API_WORKSPACE, "run", "db:deploy"]);
}

// Le clavier reste à ce script, pour la touche Entrée : Turborepo, en mode
// journaux, ne le transmet de toute façon pas aux apps.
const turbo = spawn("turbo", ["run", isTunnel ? "start" : "dev", ...filters], {
  stdio: ["ignore", "inherit", "inherit"],
  env: stackEnv,
});
turbo.on("exit", (code) => process.exit(code ?? 0));
// Ctrl+C atteint déjà Turborepo, du même groupe de processus : on le laisse
// arrêter les apps et on sort avec lui.
process.off("SIGINT", exitOnInterrupt);
process.on("SIGINT", () => {});

const services = tunnel ? listTunnelServices(tunnel.urls) : listServices(apps, needsDocker);
const probedServices = services.filter((service) => !service.isInfo);

await report(await waitForServices(probedServices));

// Mode ligne, pas mode brut : Ctrl+C reste un signal, que le terminal envoie à
// tout le groupe. Chaque appui sur Entrée revérifie les services avant d'afficher ;
// en mode tunnel, `c` puis Entrée recopie le message des PO.
// `resume()` : le choix des apps a refermé son readline, ce qui a mis le clavier
// en pause, et un écouteur seul ne le relance pas.
if (process.stdin.isTTY) {
  process.stdin.on("data", async (input) => {
    if (tunnel && input.toString().trim().toLowerCase() === COPY_COMMAND) {
      await copyTesterMessage();
      return;
    }
    await report(await findUnresponsive(probedServices), true);
  });
  process.stdin.resume();
}
