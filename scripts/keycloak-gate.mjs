/**
 * Garde placée devant Keycloak par `pnpm run dev:tunnel` : son tunnel public
 * aboutit ici, et non sur le port 8080.
 *
 * Mêmes règles que `deploy/nginx-auth.conf` en production : **tout est refusé
 * par défaut**, seuls passent les deux realms applicatifs et les ressources du
 * thème. En local, la console d'administration répond à `admin` / `admin` ; sans
 * cette garde, n'importe qui ayant l'URL du tunnel l'obtiendrait, et le realm
 * `master` lui délivrerait un jeton d'administration.
 *
 * Aucune réécriture : chaque realm ETAPE connaît son URL publique (`frontendUrl`,
 * posé par `keycloak-init`), ses redirections et ses formulaires sont déjà
 * justes.
 */
import http from "node:http";

const KEYCLOAK_ORIGIN = "http://localhost:8080";

/**
 * Demandés d'office par les navigateurs : refusés comme le reste, mais sans le
 * signaler, pour que les refus affichés soient ceux qui comptent.
 */
const SILENT_PATHS = new Set(["/favicon.ico", "/robots.txt"]);

/** Écrits en entier : un realm ajouté plus tard arrive fermé. */
const ALLOWED_REALMS = new Set(["etape", "etape-back-office"]);

/**
 * Formes qu'un serveur peut normaliser après coup (`%2e%2e`, `%2f`, `%5c`, `;`,
 * `//`, `\`) : refusées d'emblée plutôt que de parier sur la façon dont Keycloak
 * les relira — `/realms/etape/..%2fmaster/` passerait un test de préfixe, puis
 * deviendrait `/realms/master/`. Cherchées dans le chemin seul : la requête de
 * connexion porte légitimement `redirect_uri=https%3A%2F%2F…`.
 */
const AMBIGUOUS_PATH = /%2e|%2f|%5c|\\|;|\/\//i;

/**
 * Rend `true` si la cible d'une requête (`request.url`) peut être transmise à
 * Keycloak.
 *
 * @param {string} target
 * @returns {boolean}
 */
export function isAllowedPath(target) {
  const [path] = target.split("?");
  if (!path.startsWith("/") || AMBIGUOUS_PATH.test(path)) return false;

  // Un `..` ou un `.` que la normalisation résoudrait suffit à refuser : on ne
  // juge que ce que Keycloak lira tel quel.
  if (new URL(path, "http://gate").pathname !== path) return false;

  const [first, second] = path.split("/").slice(1);
  if (first === "resources") return true;
  return first === "realms" && ALLOWED_REALMS.has(second);
}

/** @param {http.IncomingMessage} request @param {http.ServerResponse} response */
function forward(request, response) {
  const upstream = http.request(
    new URL(request.url, KEYCLOAK_ORIGIN),
    {
      method: request.method,
      headers: {
        ...request.headers,
        // Posés ici plutôt que repris du tunnel, comme `deploy/nginx-auth-proxy.inc` :
        // Keycloak (`KC_PROXY_HEADERS=xforwarded`) y lit le schéma, dont dépend
        // l'attribut `Secure` de ses cookies.
        "x-forwarded-proto": "https",
        "x-forwarded-host": request.headers.host,
        "x-forwarded-for": request.headers["cf-connecting-ip"] ?? request.socket.remoteAddress,
      },
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    },
  );
  upstream.on("error", () => {
    if (!response.headersSent) response.writeHead(502);
    response.end("Keycloak injoignable.");
  });
  request.pipe(upstream);
}

/**
 * Démarre la garde, en loopback seul : elle ne doit être joignable que par le
 * tunnel. Sur un port libre tiré par le système plutôt que fixé : seul le
 * tunnel s'y connecte, et un port fixe finit par croiser celui d'un autre outil
 * (8081, par exemple, est celui de Metro). Rend le serveur et son port une fois
 * à l'écoute.
 *
 * @returns {Promise<{ server: http.Server, port: number }>}
 */
export function startKeycloakGate() {
  const server = http.createServer((request, response) => {
    if (isAllowedPath(request.url ?? "")) {
      forward(request, response);
      return;
    }
    // Affiché dans le terminal du dev : un chemin légitime bloqué pendant une
    // session de test doit se voir tout de suite, pas se deviner.
    const path = request.url?.split("?")[0] ?? "";
    if (!SILENT_PATHS.has(path)) {
      const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      console.log(`  ⛔ ${time}  garde Keycloak : ${request.method} ${path} bloqué`);
    }
    // `404` et non `403`, comme en production : un refus explicite confirmerait
    // qu'il y a là quelque chose.
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Introuvable.");
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, port: typeof address === "object" && address ? address.port : 0 });
    });
  });
}
