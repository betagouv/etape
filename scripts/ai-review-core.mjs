/**
 * Logique pure de la review IA du pre-push (`scripts/ai-review.mjs`) : quels
 * commits relire, avec quel modèle, comment lire la réponse de `claude` et quoi
 * en conclure. Aucun appel à git ni à `claude` ici : tout se teste par
 * `node --test` (`scripts/ai-review-core.test.mjs`).
 *
 * Voir `docs/conventions/outillage-agent.md`, section « Review IA en pre-push ».
 */

/** `git push` désigne par des zéros un commit qui n'existe pas (branche créée ou supprimée). */
const ZERO_SHA = /^0+$/;

const BRANCH_PREFIX = "refs/heads/";

/** Branches jamais relues : on n'y pousse pas de travail en cours. */
const PROTECTED_BRANCHES = new Set(["main"]);

/** Pourquoi on part de cette base : consigné dans le journal pour la mesure de la phase 1. */
export const BASE_REASON = {
  NEW_COMMITS: "new-commits",
  NEW_BRANCH: "new-branch",
  REWRITTEN_HISTORY: "rewritten-history",
};

export const SEVERITY = {
  CRITICAL: "critical",
  MAJOR: "major",
  MINOR: "minor",
};

const SEVERITY_ORDER = [SEVERITY.CRITICAL, SEVERITY.MAJOR, SEVERITY.MINOR];

/** `report` : la review s'affiche et ne bloque jamais (phase 1). `block` : un `critical` refuse le push (phase 2). */
export const REVIEW_MODE = {
  REPORT: "report",
  BLOCK: "block",
};

export const MODEL = {
  OPUS: "opus",
  SONNET: "sonnet",
};

/**
 * Zones où une erreur coûte cher : authentification, session, droits,
 * migrations, calcul d'éligibilité. Un diff qui en touche une est relu par
 * Opus, le reste par Sonnet. Liste à affiner pendant la phase d'observation.
 */
const SENSITIVE_PATHS = [
  /^apps\/api\/src\/auth\//,
  /\.guard\.ts$/,
  /^apps\/api\/prisma\//,
  /^apps\/api\/src\/account\//,
  /^packages\/session\//,
  /^keycloak\//,
  /^apps\/simulateur\/src\/questionnaire\//,
];

/**
 * Exclus du diff : générés, verrouillés ou relus ailleurs. La documentation
 * n'est pas relue par le hook ; elle l'est en relecture humaine.
 */
export const DIFF_EXCLUDES = [
  ":(exclude)pnpm-lock.yaml",
  ":(exclude,glob)**/*.snap",
  ":(exclude,glob)**/*.md",
  ":(exclude)apps/api/src/generated",
];

/** Au-delà, la review coûterait trop cher et durerait trop pour un hook : on la saute. */
export const MAX_DIFF_LINES = 4000;

/** Lignes de contexte autour de chaque modification : assez pour juger sans tout relire. */
export const DIFF_CONTEXT_LINES = 15;

/** Assez pour lire quelques fichiers autour du diff, pas assez pour dériver. */
export const MAX_TURNS = 8;

/**
 * Variables qui feraient passer `claude` par l'API au lieu de l'abonnement :
 * une clé exportée chez un développeur serait facturée sans qu'il le sache.
 */
const API_CREDENTIAL_VARIABLES = ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN"];

/**
 * @typedef {{ localRef: string, localSha: string, remoteRef: string, remoteSha: string }} PushRef
 * @typedef {{ severity: string, file: string, line: number, summary: string, why: string, suggestion: string, rule?: string }} Finding
 * @typedef {{ findings: Finding[], verdict: string }} Report
 */

/**
 * Lit l'entrée standard du hook `pre-push` : une ligne par ref poussée,
 * `<local_ref> <local_sha> <remote_ref> <remote_sha>`.
 *
 * @param {string} input
 * @returns {PushRef[]}
 */
export function parsePushRefs(input) {
  return input
    .split("\n")
    .map((line) => line.trim().split(/\s+/))
    .filter((fields) => fields.length === 4)
    .map(([localRef, localSha, remoteRef, remoteSha]) => ({
      localRef,
      localSha,
      remoteRef,
      remoteSha,
    }));
}

/**
 * Rend la raison de ne pas relire une ref, ou `undefined` s'il faut la relire.
 *
 * @param {PushRef} ref
 * @returns {string | undefined}
 */
export function findSkipReason(ref) {
  if (ZERO_SHA.test(ref.localSha)) return "suppression de branche";
  if (!ref.localRef.startsWith(BRANCH_PREFIX)) return "pas une branche";
  if (PROTECTED_BRANCHES.has(ref.localRef.slice(BRANCH_PREFIX.length))) return "branche main";
  return undefined;
}

/**
 * Choisit la base du diff pour ne relire **que les commits qui partent avec ce
 * push** :
 * - branche existante que le push avance → depuis l'état distant, soit les seuls nouveaux commits ;
 * - nouvelle branche → depuis sa divergence avec `origin/main`, soit tous ses commits ;
 * - historique réécrit (force-push, rebase, amend déjà poussé) ou état distant inconnu en local →
 *   depuis la divergence avec `origin/main`. Diff-er l'état distant donnerait un diff faux, voire vide.
 *
 * @param {{ remoteSha: string, isRemoteAncestor: boolean, mergeBase: string }} input
 *   `isRemoteAncestor` : `git merge-base --is-ancestor <remote_sha> <local_sha>` a réussi.
 * @returns {{ base: string, reason: string }}
 */
export function resolveBase({ remoteSha, isRemoteAncestor, mergeBase }) {
  if (ZERO_SHA.test(remoteSha)) return { base: mergeBase, reason: BASE_REASON.NEW_BRANCH };
  if (isRemoteAncestor) return { base: remoteSha, reason: BASE_REASON.NEW_COMMITS };
  return { base: mergeBase, reason: BASE_REASON.REWRITTEN_HISTORY };
}

/**
 * @param {string[]} files Chemins touchés, depuis la racine du dépôt.
 * @returns {string}
 */
export function selectModel(files) {
  const isSensitive = files.some((file) => SENSITIVE_PATHS.some((pattern) => pattern.test(file)));
  return isSensitive ? MODEL.OPUS : MODEL.SONNET;
}

/**
 * Environnement de l'appel à `claude`, sans les identifiants d'API : la review
 * passe toujours par l'abonnement du développeur.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {NodeJS.ProcessEnv}
 */
export function buildClaudeEnv(env) {
  const claudeEnv = { ...env };
  for (const variable of API_CREDENTIAL_VARIABLES) {
    delete claudeEnv[variable];
  }
  return claudeEnv;
}

/**
 * `--restricted` plutôt que `--bare` : `--bare` n'accepte qu'une clé d'API et
 * ignore l'abonnement. `--restricted` retire Bash et ignore les réglages du
 * projet (donc ses hooks) ; `--strict-mcp-config` écarte les serveurs MCP.
 * `CLAUDE.md` n'est pas chargé dans ce mode : les règles passent par
 * `--append-system-prompt`.
 *
 * @param {{ model: string, schema: string, rules: string }} input
 * @returns {string[]}
 */
export function buildClaudeArgs({ model, schema, rules }) {
  return [
    "-p",
    "--restricted",
    "--strict-mcp-config",
    "--tools",
    "Read,Grep,Glob",
    "--no-session-persistence",
    "--model",
    model,
    "--max-turns",
    String(MAX_TURNS),
    "--json-schema",
    schema,
    "--append-system-prompt",
    rules,
    "--output-format",
    "json",
  ];
}

/**
 * @param {unknown} value
 * @returns {value is Report}
 */
function isReport(value) {
  if (typeof value !== "object" || value === null) return false;
  const { findings } = /** @type {{ findings?: unknown }} */ (value);
  return (
    Array.isArray(findings) &&
    findings.every(
      (finding) =>
        typeof finding === "object" &&
        finding !== null &&
        SEVERITY_ORDER.includes(finding.severity),
    )
  );
}

/**
 * Lit la sortie `--output-format json` de `claude`. Toute réponse inexploitable
 * rend `ok: false` avec la raison, pour que le hook laisse passer le push
 * (fail open) en disant pourquoi.
 *
 * @param {string} stdout
 * @returns {{ ok: true, report: Report, numTurns: number | undefined } | { ok: false, reason: string }}
 */
export function parseClaudeOutput(stdout) {
  let output;
  try {
    output = JSON.parse(stdout);
  } catch {
    return { ok: false, reason: "sortie de claude illisible" };
  }
  if (output.is_error) {
    return { ok: false, reason: output.result || output.subtype || "erreur de claude" };
  }
  if (!isReport(output.structured_output)) {
    return { ok: false, reason: "réponse hors du format attendu" };
  }
  return { ok: true, report: output.structured_output, numTurns: output.num_turns };
}

/**
 * @param {Finding[]} findings
 * @returns {Record<string, number>}
 */
export function countBySeverity(findings) {
  /** @type {Record<string, number>} */
  const counts = { [SEVERITY.CRITICAL]: 0, [SEVERITY.MAJOR]: 0, [SEVERITY.MINOR]: 0 };
  for (const finding of findings) {
    counts[finding.severity] += 1;
  }
  return counts;
}

/**
 * Seul un `critical` en mode `block` refuse le push. Un `major` est un écart à
 * une règle écrite : [BLOCKING] pour la fusion, que la relecture humaine
 * (`review-pr`) tranchera, mais jamais pour le push.
 *
 * @param {{ mode: string | undefined, findings: Finding[] }} input
 * @returns {number}
 */
export function decideExitCode({ mode, findings }) {
  if (mode !== REVIEW_MODE.BLOCK) return 0;
  return findings.some((finding) => finding.severity === SEVERITY.CRITICAL) ? 1 : 0;
}

/** @type {Record<string, { label: string, style: string }>} */
const SEVERITY_DISPLAY = {
  [SEVERITY.CRITICAL]: { label: "CRITIQUE", style: "red" },
  [SEVERITY.MAJOR]: { label: "CONVENTION", style: "yellow" },
  [SEVERITY.MINOR]: { label: "suggestion", style: "gray" },
};

/**
 * Le rapport tel qu'il s'affiche dans le terminal, du plus grave au moins grave.
 *
 * @param {Report} report
 * @param {(style: string | string[], text: string) => string} paint `util.styleText` en terminal, l'identité en test.
 * @returns {string}
 */
export function formatReport(report, paint) {
  if (report.findings.length === 0) {
    return paint("green", "[ai-review] Aucun constat.");
  }

  const lines = [];
  for (const severity of SEVERITY_ORDER) {
    const display = SEVERITY_DISPLAY[severity];
    for (const finding of report.findings.filter((item) => item.severity === severity)) {
      const location = `${finding.file}:${finding.line}`;
      if (severity === SEVERITY.MINOR) {
        lines.push(`${paint(display.style, display.label)} ${location} — ${finding.summary}`);
        continue;
      }
      lines.push(`${paint(["bold", display.style], display.label)} ${location}`);
      lines.push(`  ${finding.summary}`);
      lines.push(`  Pourquoi : ${finding.why}`);
      if (finding.rule) lines.push(`  Règle : ${finding.rule}`);
      lines.push(`  Correction : ${finding.suggestion}`);
      lines.push("");
    }
  }

  const counts = countBySeverity(report.findings);
  lines.push(
    `[ai-review] ${counts[SEVERITY.CRITICAL]} critique(s), ${counts[SEVERITY.MAJOR]} écart(s) de convention, ${counts[SEVERITY.MINOR]} suggestion(s).`,
  );
  if (counts[SEVERITY.MAJOR] > 0) {
    lines.push(
      "[ai-review] Les écarts de convention sont [BLOCKING] en relecture : à corriger avant la PR.",
    );
  }
  return lines.join("\n");
}
