/**
 * Review IA des commits qui partent avec un `git push`, par `claude -p` sur
 * l'abonnement du développeur. Branché sur `.husky/pre-push`.
 *
 * - `node scripts/ai-review.mjs --pre-push` : appelé par le hook, lit les refs poussées sur stdin ;
 * - `pnpm run ai-review` : relit à la demande les commits de la branche courante pas encore poussés ;
 * - `pnpm run ai-review:last` : réaffiche le dernier rapport.
 *
 * **Fail open** : sans `claude`, sans connexion, sur un timeout ou une réponse
 * inexploitable, le push passe avec un avertissement. En mode `report` (défaut),
 * la review ne bloque jamais ; en mode `block` (`ETAPE_REVIEW_MODE=block`), un
 * constat `critical` refuse le push.
 *
 * Tout ce qui est propre à la machine reste dans `.git/etape-review/` : un
 * rapport par diff relu (le cache), le dernier rapport et le journal de mesure.
 *
 * Voir `docs/conventions/outillage-agent.md`, section « Review IA en pre-push ».
 */
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { styleText } from "node:util";

import {
  DIFF_CONTEXT_LINES,
  DIFF_EXCLUDES,
  MAX_DIFF_LINES,
  buildClaudeArgs,
  buildClaudeEnv,
  buildNotification,
  countBySeverity,
  decideExitCode,
  findSkipReason,
  formatMarkdown,
  formatReport,
  parseClaudeOutput,
  parsePushRefs,
  resolveBase,
  selectModel,
} from "./ai-review-core.mjs";

const PROMPT_PATH = ".claude/review/prompt.md";
const SCHEMA_PATH = ".claude/review/findings.schema.json";
const RULES_DIR = ".claude/rules";
const MAIN_REF = "origin/main";
const ZERO_SHA = "0".repeat(40);
const DEFAULT_TIMEOUT_S = 150;

/** @param {string[]} args */
function git(...args) {
  // stderr capturé : un `git merge-base --is-ancestor` qui échoue est un cas prévu, pas une erreur à afficher.
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/**
 * @param {string[]} args
 * @returns {string | undefined}
 */
function tryGit(...args) {
  try {
    return git(...args);
  } catch {
    return undefined;
  }
}

/** @param {string} message */
function warn(message) {
  console.error(styleText("yellow", `[ai-review] ${message}`));
}

/** `git rev-parse --git-path` plutôt que `.git/` en dur : juste aussi dans un worktree. */
let stateDir = "";
let lastReportPath = "";
let lastMarkdownPath = "";
let journalPath = "";

function initState() {
  process.chdir(git("rev-parse", "--show-toplevel"));
  stateDir = path.resolve(git("rev-parse", "--git-path", "etape-review"));
  lastReportPath = path.join(stateDir, "last.json");
  lastMarkdownPath = path.join(stateDir, "last.md");
  journalPath = path.join(stateDir, "journal.jsonl");
  mkdirSync(stateDir, { recursive: true });
}

/**
 * Commande de notification par système. Absente ailleurs : on n'affiche rien.
 *
 * @type {Partial<Record<NodeJS.Platform, (notification: { title: string, message: string }) => string[]>>}
 */
const NOTIFIERS = {
  // `on run argv` : titre et message passent en arguments, sans échappement AppleScript.
  darwin: ({ title, message }) => [
    "osascript",
    "-e",
    "on run argv",
    "-e",
    "display notification (item 2 of argv) with title (item 1 of argv)",
    "-e",
    "end run",
    title,
    message,
  ],
  linux: ({ title, message }) => ["notify-send", title, message],
};

/**
 * Notification système de fin de review, sans l'attendre ni échouer : un poste
 * sans `notify-send` n'en a simplement pas. `ETAPE_REVIEW_NOTIFY=0` la coupe.
 *
 * @param {{ title: string, message: string } | undefined} notification
 */
function notify(notification) {
  if (!notification || process.env.ETAPE_REVIEW_NOTIFY === "0") return;
  const command = NOTIFIERS[process.platform]?.(notification);
  if (!command) return;
  const child = spawn(command[0], command.slice(1), { stdio: "ignore", detached: true });
  child.on("error", () => {});
  child.unref();
}

/** @param {Record<string, unknown>} entry */
function appendJournal(entry) {
  appendFileSync(journalPath, `${JSON.stringify({ date: new Date().toISOString(), ...entry })}\n`);
}

/** Les condensés de `.claude/rules/` : `CLAUDE.md` n'est pas chargé en mode `--restricted`. */
function readRules() {
  const files = readdirSync(RULES_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort();
  const sections = files.map((file) => {
    const relativePath = `${RULES_DIR}/${file}`;
    return `# ${relativePath}\n\n${readFileSync(relativePath, "utf8")}`;
  });
  return `Règles du projet ETAPE (condensés de ${RULES_DIR}/) :\n\n${sections.join("\n\n")}`;
}

/**
 * @param {{ model: string, diff: string }} input
 * @returns {Promise<ReturnType<typeof parseClaudeOutput>>}
 */
function runClaude({ model, diff }) {
  const timeoutS = Number(process.env.ETAPE_REVIEW_TIMEOUT_S) || DEFAULT_TIMEOUT_S;
  const args = buildClaudeArgs({
    model,
    schema: readFileSync(SCHEMA_PATH, "utf8"),
    rules: readRules(),
  });

  return new Promise((resolve) => {
    const child = spawn("claude", args, {
      env: buildClaudeEnv(process.env),
      signal: AbortSignal.timeout(timeoutS * 1000),
    });
    let stdout = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    // `claude` absent : l'écriture sur stdin échoue aussi, sans conséquence.
    child.stdin.on("error", () => {});
    child.on("error", (error) => {
      if (error.name === "AbortError")
        resolve({ ok: false, reason: `pas de réponse en ${timeoutS} s` });
      else if ("code" in error && error.code === "ENOENT")
        resolve({ ok: false, reason: "claude n'est pas installé" });
      else resolve({ ok: false, reason: error.message });
    });
    child.on("close", () => resolve(parseClaudeOutput(stdout)));
    child.stdin.end(`${readFileSync(PROMPT_PATH, "utf8")}\n\n<diff>\n${diff}\n</diff>\n`);
  });
}

/**
 * @param {{ branch: string, localSha: string, remoteSha: string }} target
 * @returns {Promise<number>} Code de sortie pour cette branche.
 */
async function reviewTarget({ branch, localSha, remoteSha }) {
  const mergeBase = tryGit("merge-base", MAIN_REF, localSha);
  if (!mergeBase) {
    warn(`${MAIN_REF} introuvable (git fetch ?) — review sautée, push autorisé.`);
    appendJournal({ branch, skipped: "no-merge-base" });
    return 0;
  }

  // Échoue aussi quand l'état distant n'existe pas en local : traité comme un historique réécrit.
  const isRemoteAncestor =
    remoteSha !== ZERO_SHA &&
    tryGit("merge-base", "--is-ancestor", remoteSha, localSha) !== undefined;
  const { base, reason } = resolveBase({ remoteSha, isRemoteAncestor, mergeBase });
  const range = ["--", ".", ...DIFF_EXCLUDES];

  const diff = git("diff", base, localSha, `--unified=${DIFF_CONTEXT_LINES}`, ...range);
  if (diff === "") {
    appendJournal({ branch, reason, skipped: "empty-diff" });
    return 0;
  }
  const diffLines = diff.split("\n").length;
  if (diffLines > MAX_DIFF_LINES) {
    warn(`diff de ${diffLines} lignes (plafond ${MAX_DIFF_LINES}) — review sautée, push autorisé.`);
    appendJournal({ branch, reason, diffLines, skipped: "diff-too-large" });
    return 0;
  }

  const commits = Number(git("rev-list", "--count", `${base}..${localSha}`));
  const hash = createHash("sha256").update(diff).digest("hex").slice(0, 16);
  const cachePath = path.join(stateDir, `${hash}.json`);
  const startedAt = Date.now();

  let report;
  let model;
  const isCached = existsSync(cachePath);
  if (isCached) {
    ({ report, model } = JSON.parse(readFileSync(cachePath, "utf8")));
    console.log(`[ai-review] ${branch} : diff déjà relu (${hash}), rapport réutilisé.`);
  } else {
    model = selectModel(git("diff", "--name-only", base, localSha, ...range).split("\n"));
    console.log(`[ai-review] ${branch} : relecture de ${commits} commit(s) par ${model}…`);
    const result = await runClaude({ model, diff });
    if (!result.ok) {
      warn(`${result.reason} — review sautée, push autorisé.`);
      appendJournal({
        branch,
        reason,
        commits,
        hash,
        model,
        durationMs: Date.now() - startedAt,
        skipped: result.reason,
      });
      return 0;
    }
    report = result.report;
    writeFileSync(cachePath, JSON.stringify({ model, report }, null, 2));
  }

  const saved = { date: new Date().toISOString(), branch, base, reason, commits, model, report };
  writeFileSync(lastReportPath, JSON.stringify(saved, null, 2));
  writeFileSync(lastMarkdownPath, formatMarkdown(saved));
  console.log(formatReport(report, styleText));
  if (report.findings.length > 0) {
    console.log(`[ai-review] Rapport complet : ${lastMarkdownPath}`);
  }
  if (process.argv.includes("--pre-push")) {
    notify(buildNotification({ branch, findings: report.findings }));
  }
  appendJournal({
    branch,
    reason,
    commits,
    hash,
    model,
    isCached,
    durationMs: Date.now() - startedAt,
    counts: countBySeverity(report.findings),
  });

  const exitCode = decideExitCode({
    mode: process.env.ETAPE_REVIEW_MODE,
    findings: report.findings,
  });
  if (exitCode !== 0) {
    console.error(
      styleText(
        "red",
        "[ai-review] Push refusé : constat(s) critique(s). `pnpm run ai-review:last` pour revoir le rapport ; `SKIP_AI_REVIEW=1 git push` pour forcer (consigné).",
      ),
    );
  }
  return exitCode;
}

function showLastReport() {
  if (!existsSync(lastReportPath)) {
    console.log("[ai-review] Aucun rapport pour l'instant.");
    return;
  }
  const last = JSON.parse(readFileSync(lastReportPath, "utf8"));
  console.log(
    `[ai-review] ${last.branch}, ${last.commits} commit(s), relu par ${last.model} le ${last.date}\n`,
  );
  console.log(formatReport(last.report, styleText, { isDetailed: true }));
}

/** @returns {{ branch: string, localSha: string, remoteSha: string }[]} */
function listTargets() {
  if (process.argv.includes("--pre-push")) {
    const targets = [];
    for (const ref of parsePushRefs(readFileSync(0, "utf8"))) {
      if (findSkipReason(ref)) continue;
      targets.push({
        branch: ref.localRef.replace("refs/heads/", ""),
        localSha: ref.localSha,
        remoteSha: ref.remoteSha,
      });
    }
    return targets;
  }
  // À la demande : ce que le prochain push enverrait.
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  const upstream = tryGit("rev-parse", "--verify", "--quiet", "@{upstream}");
  return [{ branch, localSha: git("rev-parse", "HEAD"), remoteSha: upstream ?? ZERO_SHA }];
}

async function main() {
  initState();
  if (process.argv.includes("--last")) {
    showLastReport();
    return 0;
  }
  if (process.env.SKIP_AI_REVIEW) {
    warn("SKIP_AI_REVIEW — review sautée (consigné).");
    appendJournal({ skipped: "SKIP_AI_REVIEW" });
    return 0;
  }

  let exitCode = 0;
  for (const target of listTargets()) {
    exitCode = Math.max(exitCode, await reviewTarget(target));
  }
  return exitCode;
}

try {
  process.exitCode = await main();
} catch (error) {
  warn(`erreur inattendue (${error instanceof Error ? error.message : error}) — push autorisé.`);
  process.exitCode = 0;
}
