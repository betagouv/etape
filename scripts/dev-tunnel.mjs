/**
 * Mode tunnel de `pnpm run dev:stack` (`pnpm run dev:tunnel`) : le front-office,
 * le back-office et Keycloak reçoivent chacun une URL publique, pour qu'un PO
 * teste depuis son poste ce qui tourne sur celui du dev.
 *
 * Tunnels Cloudflare « Quick Tunnels » : sans compte ni configuration, sans page
 * d'avertissement, mais une URL tirée au sort à chaque lancement — d'où tout ce
 * qui suit, qui réaligne chaque lancement sur les URL du moment. Trois hôtes
 * distincts, parce que l'API reconnaît le front à son en-tête `Host` et que
 * Keycloak doit être joignable du navigateur du PO, pas seulement de l'API.
 *
 * Ce que l'URL publique change, et qui s'en charge :
 * - l'API compare `Host` et `Origin` aux URL des fronts → surchargées par
 *   l'environnement de `turbo run start`, sans toucher `apps/api/.env` ;
 * - Vite refuse les hôtes inconnus → `ETAPE_TUNNEL_HOSTS` (`vite.config.ts`) ;
 * - les realms ETAPE doivent écrire l'URL publique de Keycloak → `frontendUrl`,
 *   et leurs adresses de retour celles des fronts → `keycloak-init`, rejoué avec
 *   ces URL ; Keycloak lui-même n'est pas recréé, et `master` reste en local ;
 * - l'issuer vérifié par l'API est celui de l'URL publique → `KEYCLOAK_URL`
 *   pointe sur le tunnel, et l'API fait l'aller-retour par Internet.
 */
import { execFileSync, spawn } from "node:child_process";

import { startKeycloakGate } from "./keycloak-gate.mjs";

const TUNNEL_URL = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;

/**
 * `cloudflared` imprime l'URL avant que le nom ne résolve. Sonder dès ce moment
 * ferait mettre en cache par le résolveur du poste un « nom inconnu », qui
 * survivrait à l'ouverture du tunnel : on attend que la connexion soit
 * enregistrée.
 */
const TUNNEL_REGISTERED = /Registered tunnel connection/;
const TUNNEL_TIMEOUT_MS = 60_000;

/** Fichiers de `cloudflared` en présence desquels il refuse d'ouvrir un Quick Tunnel. */
export const CLOUDFLARED_CONFIG_FILES = ["config.yml", "config.yaml"];

/**
 * Ouvre un Quick Tunnel vers `localUrl` et rend son URL publique, une fois la
 * connexion enregistrée.
 *
 * @param {string} localUrl
 * @returns {Promise<{ url: string, process: import("node:child_process").ChildProcess }>}
 */
function openTunnel(localUrl) {
  return new Promise((resolve, reject) => {
    const child = spawn("cloudflared", ["tunnel", "--no-autoupdate", "--url", localUrl], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let log = "";
    let isOpen = false;
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`tunnel vers ${localUrl} : pas d'URL après ${TUNNEL_TIMEOUT_MS / 1000} s`));
    }, TUNNEL_TIMEOUT_MS);

    child.stderr.setEncoding("utf8");
    // Lu jusqu'au bout même une fois le tunnel ouvert : un tube qui n'est plus
    // vidé finit par bloquer `cloudflared`.
    child.stderr.on("data", (chunk) => {
      if (isOpen) return;
      log += chunk;
      const url = log.match(TUNNEL_URL)?.[0];
      if (url && TUNNEL_REGISTERED.test(log)) {
        isOpen = true;
        clearTimeout(timer);
        resolve({ url, process: child });
      }
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (isOpen) {
        console.log(`  ✗ tunnel vers ${localUrl} fermé (code ${code}) : son URL ne répond plus.`);
        return;
      }
      reject(new Error(`cloudflared vers ${localUrl} arrêté (code ${code}) :\n${log.slice(-800)}`));
    });
  });
}

/**
 * Démarre la garde de Keycloak et les trois tunnels. Rend les URL publiques,
 * l'environnement à passer à `docker compose` et aux apps, et de quoi tout
 * refermer.
 *
 * @param {{ frontOfficePort: number, backOfficePort: number }} ports
 */
export async function startTunnels({ frontOfficePort, backOfficePort }) {
  const gate = await startKeycloakGate();
  const results = await Promise.allSettled([
    openTunnel(`http://localhost:${frontOfficePort}`),
    openTunnel(`http://localhost:${backOfficePort}`),
    openTunnel(`http://127.0.0.1:${gate.port}`),
  ]);
  const failure = results.find((result) => result.status === "rejected");
  if (failure) {
    // Ceux qui se sont ouverts ne doivent pas survivre au lancement avorté.
    for (const result of results) {
      if (result.status === "fulfilled") result.value.process.kill();
    }
    gate.server.close();
    throw failure.reason;
  }
  const tunnels = results.map((result) => result.value);
  const [frontOffice, backOffice, keycloak] = tunnels.map((tunnel) => tunnel.url);

  // Un seul jeu de variables pour Docker et pour Turborepo : `keycloak-init` lit
  // les mêmes noms que l'API.
  const env = {
    FRONT_OFFICE_BASE_URL: frontOffice,
    FRONT_OFFICE_API_BASE_URL: `${frontOffice}/api`,
    BACK_OFFICE_BASE_URL: backOffice,
    BACK_OFFICE_API_BASE_URL: `${backOffice}/api`,
    KEYCLOAK_URL: keycloak,
    KEYCLOAK_PUBLIC_URL: keycloak,
    ETAPE_TUNNEL_HOSTS: [frontOffice, backOffice].map((url) => new URL(url).host).join(","),
  };

  return {
    urls: { frontOffice, backOffice, keycloak },
    env,
    close() {
      for (const tunnel of tunnels) tunnel.process.kill();
      gate.server.close();
    },
  };
}

/**
 * Rejoue `keycloak-init` sans les URL du tunnel : les realms ETAPE reviennent
 * sur localhost. Synchrone, pour tourner dans un écouteur `exit` ; `up -d` rend
 * la main dès le conteneur lancé, qui finit son travail en arrière-plan. Rend
 * `false` si Docker n'a pas pu le lancer.
 *
 * @returns {boolean}
 */
export function restoreLocalKeycloak() {
  try {
    execFileSync("docker", ["compose", "up", "-d", "keycloak-init"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Message prêt à coller pour les PO. Sans le mot de passe du compte de test :
 * il se transmet à part, pas dans un canal où le message sera recopié.
 *
 * @param {{ frontOffice: string, backOffice: string }} urls
 * @returns {string}
 */
export function formatTesterMessage({ frontOffice, backOffice }) {
  return [
    "ETAPE — environnement de test (poste du dev, ouvert le temps de la session)",
    `Front-office : ${frontOffice}`,
    `Back-office  : ${backOffice}`,
    "Compte de test : test@etape.local (mot de passe transmis à part)",
    "Les adresses changent à chaque session.",
  ].join("\n");
}

/**
 * Copie dans le presse-papier, macOS seulement (`pbcopy`). Rend `false` si la
 * copie n'a pas pu se faire : le message reste affiché.
 *
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export function copyToClipboard(text) {
  return new Promise((resolve) => {
    const child = spawn("pbcopy", [], { stdio: ["pipe", "ignore", "ignore"] });
    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
    // Sans `pbcopy`, l'écriture échoue aussi : déjà rendu par `error` ci-dessus.
    child.stdin.on("error", () => {});
    child.stdin.end(text);
  });
}
