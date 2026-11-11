import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BASE_REASON,
  MODEL,
  REVIEW_MODE,
  SEVERITY,
  buildClaudeArgs,
  buildClaudeEnv,
  countBySeverity,
  decideExitCode,
  findSkipReason,
  formatReport,
  parseClaudeOutput,
  parsePushRefs,
  resolveBase,
  selectModel,
} from "./ai-review-core.mjs";

const ZERO = "0".repeat(40);
const LOCAL = "a".repeat(40);
const REMOTE = "b".repeat(40);
const MERGE_BASE = "c".repeat(40);

/**
 * @param {string} severity
 * @param {Partial<import("./ai-review-core.mjs").Finding>} [overrides]
 */
function finding(severity, overrides = {}) {
  return {
    severity,
    file: "apps/site/src/page.tsx",
    line: 12,
    summary: "Résumé",
    why: "Scénario",
    suggestion: "Correction",
    ...overrides,
  };
}

describe("parsePushRefs", () => {
  it("lit une ligne par ref poussée", () => {
    const input = `refs/heads/feat/x ${LOCAL} refs/heads/feat/x ${REMOTE}\nrefs/tags/v1 ${LOCAL} refs/tags/v1 ${ZERO}\n`;
    assert.deepEqual(parsePushRefs(input), [
      {
        localRef: "refs/heads/feat/x",
        localSha: LOCAL,
        remoteRef: "refs/heads/feat/x",
        remoteSha: REMOTE,
      },
      { localRef: "refs/tags/v1", localSha: LOCAL, remoteRef: "refs/tags/v1", remoteSha: ZERO },
    ]);
  });

  it("ignore une entrée vide ou incomplète", () => {
    assert.deepEqual(parsePushRefs(""), []);
    assert.deepEqual(parsePushRefs("refs/heads/x abc\n"), []);
  });
});

describe("findSkipReason", () => {
  const ref = {
    localRef: "refs/heads/feat/x",
    localSha: LOCAL,
    remoteRef: "refs/heads/feat/x",
    remoteSha: REMOTE,
  };

  it("relit une branche de travail", () => assert.equal(findSkipReason(ref), undefined));
  it("saute une suppression de branche", () =>
    assert.ok(findSkipReason({ ...ref, localSha: ZERO })));
  it("saute un tag", () => assert.ok(findSkipReason({ ...ref, localRef: "refs/tags/v1" })));
  it("saute main", () => assert.ok(findSkipReason({ ...ref, localRef: "refs/heads/main" })));
  it("relit une branche dont le nom contient main", () =>
    assert.equal(findSkipReason({ ...ref, localRef: "refs/heads/feat/main-menu" }), undefined));
});

describe("resolveBase", () => {
  it("branche existante que le push avance : seulement les nouveaux commits", () =>
    assert.deepEqual(
      resolveBase({ remoteSha: REMOTE, isRemoteAncestor: true, mergeBase: MERGE_BASE }),
      {
        base: REMOTE,
        reason: BASE_REASON.NEW_COMMITS,
      },
    ));

  it("nouvelle branche : tous ses commits depuis origin/main", () =>
    assert.deepEqual(
      resolveBase({ remoteSha: ZERO, isRemoteAncestor: false, mergeBase: MERGE_BASE }),
      {
        base: MERGE_BASE,
        reason: BASE_REASON.NEW_BRANCH,
      },
    ));

  it("force-push ou état distant inconnu : retour à la divergence avec origin/main", () =>
    assert.deepEqual(
      resolveBase({ remoteSha: REMOTE, isRemoteAncestor: false, mergeBase: MERGE_BASE }),
      {
        base: MERGE_BASE,
        reason: BASE_REASON.REWRITTEN_HISTORY,
      },
    ));
});

describe("selectModel", () => {
  const sensitive = [
    "apps/api/src/auth/auth.controller.ts",
    "apps/api/src/auth/session/session.guard.ts",
    "apps/api/src/dossier/dossier.guard.ts",
    "apps/api/prisma/schema.prisma",
    "apps/api/prisma/migrations/20261008150000_x/migration.sql",
    "apps/api/src/account/account.service.ts",
    "packages/session/src/index.ts",
    "keycloak/realms/etape.json",
    "apps/simulateur/src/questionnaire/domain/eligibilite.ts",
  ];
  for (const file of sensitive) {
    it(`Opus pour ${file}`, () =>
      assert.equal(selectModel(["apps/site/src/page.tsx", file]), MODEL.OPUS));
  }

  it("Sonnet ailleurs", () =>
    assert.equal(
      selectModel(["apps/site/src/page.tsx", "packages/ui/src/button.tsx"]),
      MODEL.SONNET,
    ));
  it("Sonnet sans fichier", () => assert.equal(selectModel([""]), MODEL.SONNET));
});

describe("buildClaudeEnv", () => {
  it("retire les identifiants d'API pour passer par l'abonnement", () => {
    const env = buildClaudeEnv({
      PATH: "/usr/bin",
      ANTHROPIC_API_KEY: "sk-x",
      ANTHROPIC_AUTH_TOKEN: "t",
    });
    assert.deepEqual(env, { PATH: "/usr/bin" });
  });

  it("ne modifie pas l'environnement reçu", () => {
    const original = { ANTHROPIC_API_KEY: "sk-x" };
    buildClaudeEnv(original);
    assert.equal(original.ANTHROPIC_API_KEY, "sk-x");
  });
});

describe("buildClaudeArgs", () => {
  const args = buildClaudeArgs({ model: MODEL.SONNET, schema: "{}", rules: "règles" });

  it("lecture seule, sans Bash ni MCP", () => {
    assert.ok(args.includes("--restricted"));
    assert.ok(args.includes("--strict-mcp-config"));
    assert.equal(args[args.indexOf("--tools") + 1], "Read,Grep,Glob");
  });

  it("jamais --bare, qui ignore l'abonnement", () => assert.ok(!args.includes("--bare")));

  it("passe le modèle, le schéma et les règles", () => {
    assert.equal(args[args.indexOf("--model") + 1], MODEL.SONNET);
    assert.equal(args[args.indexOf("--json-schema") + 1], "{}");
    assert.equal(args[args.indexOf("--append-system-prompt") + 1], "règles");
  });
});

describe("parseClaudeOutput", () => {
  it("rend le rapport structuré", () => {
    const report = { findings: [finding(SEVERITY.MAJOR)], verdict: "needs-work" };
    const stdout = JSON.stringify({ is_error: false, num_turns: 3, structured_output: report });
    assert.deepEqual(parseClaudeOutput(stdout), { ok: true, report, numTurns: 3 });
  });

  it("sortie illisible : fail open", () =>
    assert.equal(parseClaudeOutput("pas du JSON").ok, false));

  it("non connecté : rend le message de claude", () =>
    assert.deepEqual(
      parseClaudeOutput(
        JSON.stringify({ is_error: true, result: "Not logged in · Please run /login" }),
      ),
      { ok: false, reason: "Not logged in · Please run /login" },
    ));

  it("limite de tours atteinte : fail open", () =>
    assert.deepEqual(
      parseClaudeOutput(
        JSON.stringify({ is_error: true, subtype: "error_max_turns", result: null }),
      ),
      {
        ok: false,
        reason: "error_max_turns",
      },
    ));

  it("réponse hors format : fail open", () => {
    assert.equal(
      parseClaudeOutput(
        JSON.stringify({ is_error: false, structured_output: { verdict: "ready" } }),
      ).ok,
      false,
    );
    assert.equal(
      parseClaudeOutput(
        JSON.stringify({
          is_error: false,
          structured_output: { findings: [{ severity: "blocker" }], verdict: "ready" },
        }),
      ).ok,
      false,
    );
  });
});

describe("countBySeverity", () => {
  it("compte chaque niveau, zéro compris", () =>
    assert.deepEqual(
      countBySeverity([finding(SEVERITY.MAJOR), finding(SEVERITY.MAJOR), finding(SEVERITY.MINOR)]),
      {
        critical: 0,
        major: 2,
        minor: 1,
      },
    ));
});

describe("decideExitCode", () => {
  const critical = [finding(SEVERITY.CRITICAL)];
  const majorAndMinor = [finding(SEVERITY.MAJOR), finding(SEVERITY.MINOR)];

  it("mode report : ne bloque jamais", () => {
    assert.equal(decideExitCode({ mode: REVIEW_MODE.REPORT, findings: critical }), 0);
    assert.equal(decideExitCode({ mode: undefined, findings: critical }), 0);
  });

  it("mode block : un critical refuse le push", () =>
    assert.equal(
      decideExitCode({ mode: REVIEW_MODE.BLOCK, findings: [...majorAndMinor, ...critical] }),
      1,
    ));

  it("mode block : un écart de convention ne refuse pas le push", () =>
    assert.equal(decideExitCode({ mode: REVIEW_MODE.BLOCK, findings: majorAndMinor }), 0));
});

describe("formatReport", () => {
  /** @param {string | string[]} _style @param {string} text */
  const plain = (_style, text) => text;

  it("aucun constat", () =>
    assert.match(formatReport({ findings: [], verdict: "ready" }, plain), /Aucun constat/));

  it("du plus grave au moins grave, règle citée pour un écart de convention", () => {
    const output = formatReport(
      {
        findings: [
          finding(SEVERITY.MINOR, { summary: "Nom peu clair" }),
          finding(SEVERITY.MAJOR, { rule: "docs/conventions/typescript.md §2" }),
          finding(SEVERITY.CRITICAL, { file: "apps/api/src/auth/csrf.guard.ts", line: 40 }),
        ],
        verdict: "needs-work",
      },
      plain,
    );
    const critical = output.indexOf("CRITIQUE apps/api/src/auth/csrf.guard.ts:40");
    const major = output.indexOf("CONVENTION");
    const minor = output.indexOf("suggestion apps/site/src/page.tsx:12 — Nom peu clair");
    assert.ok(critical >= 0 && critical < major && major < minor, output);
    assert.match(output, /Règle : docs\/conventions\/typescript\.md §2/);
    assert.match(output, /\[BLOCKING\] en relecture/);
  });
});
