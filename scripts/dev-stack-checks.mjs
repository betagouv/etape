/**
 * Vérifications de `npm run dev:stack`, avant tout lancement. Chacune rend un
 * constat : une erreur arrête le lancement, un avertissement le laisse passer.
 * Chaque constat dit quoi faire : c'est l'intérêt de les faire ici plutôt que de
 * laisser les apps échouer plus loin, avec des messages moins parlants.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";

/** `.env` racine : seuls ces secrets sont indispensables (voir `.env.example`). */
const ROOT_REQUIRED_KEYS = [
  "FRONT_OFFICE_KEYCLOAK_CLIENT_SECRET",
  "BACK_OFFICE_KEYCLOAK_CLIENT_SECRET",
];

/** Ports publiés par `docker-compose.yml` : base applicative et Keycloak. */
const DOCKER_PORTS = [5432, 8080];

const VAULT_HINT = "le `.env` à jour se récupère dans le coffre-fort de l'équipe";

function readEnvFile(path) {
  const entries = new Map();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      entries.set(match[1], match[2].trim().replace(/^(["'])(.*)\1$/, "$2"));
    }
  }
  return entries;
}

function succeeds(command, args) {
  try {
    execFileSync(command, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function output(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

function checkNodeVersion() {
  const expected = readFileSync(".nvmrc", "utf8").trim();
  const current = process.versions.node.split(".")[0];
  return current === expected.split(".")[0]
    ? []
    : [
        {
          isBlocking: false,
          message: `Node ${process.versions.node}, alors que .nvmrc attend ${expected}`,
          hint: "`nvm use` (ou fnm, volta) avant de lancer",
        },
      ];
}

function checkDependencies() {
  const installed = "node_modules/.package-lock.json";
  if (!existsSync(installed)) {
    return [{ isBlocking: true, message: "dépendances non installées", hint: "`npm ci`" }];
  }
  return statSync("package-lock.json").mtimeMs > statSync(installed).mtimeMs
    ? [
        {
          isBlocking: false,
          message: "package-lock.json a changé depuis la dernière installation",
          hint: "`npm ci` pour réaligner node_modules",
        },
      ]
    : [];
}

function checkDocker() {
  return succeeds("docker", ["info"])
    ? []
    : [{ isBlocking: true, message: "Docker ne répond pas", hint: "démarrer Docker Desktop" }];
}

/** Chaque variable de `<dir>/.env.example` doit figurer, non vide, dans `<dir>/.env`. */
function checkEnvAgainstExample(dir) {
  const envPath = `${dir}/.env`;
  if (!existsSync(envPath)) {
    return [{ isBlocking: true, message: `${envPath} manquant`, hint: VAULT_HINT }];
  }
  const env = readEnvFile(envPath);
  const missing = [...readEnvFile(`${dir}/.env.example`).keys()].filter((key) => !env.get(key));
  return missing.length === 0
    ? []
    : [
        {
          isBlocking: true,
          message: `${envPath} : ${missing.join(", ")} absente(s) ou vide(s)`,
          hint: `${VAULT_HINT}, ou compléter depuis ${dir}/.env.example`,
        },
      ];
}

function checkRootEnv() {
  if (!existsSync(".env")) {
    return [{ isBlocking: true, message: ".env manquant à la racine", hint: VAULT_HINT }];
  }
  const env = readEnvFile(".env");
  const missing = ROOT_REQUIRED_KEYS.filter((key) => !env.get(key));
  const issues =
    missing.length === 0
      ? []
      : [
          {
            isBlocking: true,
            message: `.env (racine) : ${missing.join(", ")} absente(s) ou vide(s)`,
            hint: VAULT_HINT,
          },
        ];
  if (!env.get("KEYCLOAK_TEST_USER_PASSWORD")) {
    issues.push({
      isBlocking: false,
      message: "pas de KEYCLOAK_TEST_USER_PASSWORD : aucun compte de test ne sera créé",
      hint: "le renseigner dans le .env racine pour avoir test@etape.local",
    });
  }
  return issues;
}

/** Les secrets du client `etape-api` posés par `keycloak-init` sont ceux qu'utilise l'API. */
function checkSecretsMatch() {
  if (!existsSync(".env") || !existsSync("apps/api/.env")) {
    return [];
  }
  const root = readEnvFile(".env");
  const api = readEnvFile("apps/api/.env");
  const different = ROOT_REQUIRED_KEYS.filter(
    (key) => root.get(key) && api.get(key) && root.get(key) !== api.get(key),
  );
  return different.length === 0
    ? []
    : [
        {
          isBlocking: true,
          message: `${different.join(", ")} diffère(nt) entre .env et apps/api/.env`,
          hint: "la connexion échouerait au retour de Keycloak : recopier la même valeur des deux côtés",
        },
      ];
}

/**
 * Un port déjà pris fait échouer l'app ou le conteneur qui l'attend. Ceux que
 * tiennent les conteneurs de ce `docker-compose.yml` ne comptent pas : ils seront
 * réutilisés tels quels.
 */
function checkPorts(ports) {
  if (!succeeds("lsof", ["-v"])) {
    return [
      { isBlocking: false, message: "lsof introuvable : ports non vérifiés", hint: "rien à faire" },
    ];
  }
  const ownContainers = new Set(
    output("docker", ["compose", "ps", "-q"]).split("\n").filter(Boolean),
  );
  return ports.flatMap((port) => {
    const holder = output("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-Fc"])
      .split("\n")
      .find((line) => line.startsWith("c"))
      ?.slice(1);
    if (!holder) {
      return [];
    }
    const containers = output("docker", ["ps", "-q", "--no-trunc", "--filter", `publish=${port}`])
      .split("\n")
      .filter(Boolean);
    if (containers.some((id) => [...ownContainers].some((own) => id.startsWith(own)))) {
      return [];
    }
    if (containers.length > 0) {
      const containerName = output("docker", ["inspect", "-f", "{{.Name}}", containers[0]])
        .trim()
        .replace(/^\//, "");
      return [
        {
          isBlocking: true,
          message: `port ${port} déjà pris par le conteneur ${containerName}`,
          hint: `docker stop ${containerName}`,
        },
      ];
    }
    return [
      {
        isBlocking: true,
        message: `port ${port} déjà pris par ${holder}`,
        hint: `arrêter ce processus (lsof -nP -iTCP:${port} -sTCP:LISTEN)`,
      },
    ];
  });
}

/**
 * @param {{ ports: number[], envDirs: string[], needsDocker: boolean }} scope
 * Les ports et les `.env` des apps retenues ; `needsDocker` quand l'API en est.
 */
export function runChecks({ ports, envDirs, needsDocker }) {
  const dockerIssues = needsDocker ? checkDocker() : [];
  const isDockerUp = dockerIssues.length === 0;
  return [
    ...checkNodeVersion(),
    ...checkDependencies(),
    ...dockerIssues,
    ...(needsDocker ? checkRootEnv() : []),
    ...envDirs.flatMap(checkEnvAgainstExample),
    ...(needsDocker ? checkSecretsMatch() : []),
    ...checkPorts(needsDocker && isDockerUp ? [...DOCKER_PORTS, ...ports] : ports),
  ];
}
