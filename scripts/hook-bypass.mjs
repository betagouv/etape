/**
 * Repère, dans une commande shell, ce qui contourne les hooks git du dépôt
 * (`lint-staged` en pre-commit, typecheck et review IA en pre-push).
 *
 * Utilisé par `.claude/hooks/block-hook-bypass.mjs` pour qu'un agent ne
 * contourne pas ce qu'on impose aux humains. Côté humain, rien n'empêche
 * techniquement `--no-verify` : le levier y est social et mesuré.
 *
 * Volontairement simple : on découpe aux opérateurs du shell et on lit les mots.
 * Une chaîne entre guillemets compte pour un seul mot : ni le motif d'un
 * `grep "HUSKY=0 git push|…"` ni le message d'un `git commit -m "corrige -n"`
 * ne sont lus comme des commandes ou des options.
 *
 * Seul compte un `git` en position de commande : en tête, ou après des
 * affectations de variables, un mot-clé du shell (`then`, `do`…) ou une commande
 * qui en lance une autre (`sudo`, `command`, `time`, `env`…). Un
 * `echo git push --no-verify` ne fait que citer, et passe.
 */

/** Sous-commandes dont les hooks comptent. */
const HOOKED_SUBCOMMANDS = new Set(["push", "commit"]);

/** Variables qui désactivent les hooks quand elles préfixent la commande. */
const BYPASS_VARIABLES = [/^HUSKY=0$/, /^SKIP_AI_REVIEW=/];

/** Opérateurs et sous-shells : chacun commence une nouvelle commande. */
const SEGMENT_SEPARATOR = /&&|\|\||[;|\n()`]/;

const QUOTED = /'[^']*'|"(?:\\.|[^"\\])*"/g;

/** Ce qui, dans une chaîne entre guillemets, ferait sinon changer de mot ou de commande. */
const QUOTED_BREAKS = /[\s;|&]/g;

const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

/** Mots-clés du shell après lesquels une commande commence. */
const SHELL_KEYWORDS = new Set(["if", "then", "else", "elif", "while", "until", "do", "!", "{"]);

/** Commandes qui en lancent une autre : le `git` qui les suit est exécuté, pas cité. */
const COMMAND_RUNNERS = new Set([
  "env",
  "sudo",
  "command",
  "builtin",
  "exec",
  "time",
  "nice",
  "nohup",
  "xargs",
]);

/**
 * Position du `git` exécuté par ce segment, ou -1 s'il n'en exécute pas.
 *
 * @param {string[]} words
 * @returns {number}
 */
function findGitIndex(words) {
  let index = 0;
  while (SHELL_KEYWORDS.has(words[index]) || ASSIGNMENT.test(words[index] ?? "")) {
    index += 1;
  }
  if (words[index] === "git") return index;
  // Les options d'une telle commande et leurs valeurs (`sudo -u eric`, `env -i`) précèdent `git`.
  if (COMMAND_RUNNERS.has(words[index])) return words.indexOf("git", index + 1);
  return -1;
}

/**
 * Rend la raison du refus, ou `undefined` si la commande ne contourne rien.
 *
 * @param {string} command
 * @returns {string | undefined}
 */
export function findHookBypass(command) {
  // `"HUSKY=0 git push"` devient le mot unique `HUSKY=0_git_push`, que rien ne reconnaît ;
  // `"core.hooksPath=/dev/null"` reste lisible tel quel.
  const unquoted = command.replace(QUOTED, (quoted) =>
    quoted.slice(1, -1).replace(QUOTED_BREAKS, "_"),
  );
  for (const segment of unquoted.split(SEGMENT_SEPARATOR)) {
    const words = segment.trim().split(/\s+/);

    if (
      words[0] === "export" &&
      words.slice(1).some((word) => BYPASS_VARIABLES.some((pattern) => pattern.test(word)))
    ) {
      return `\`${segment.trim()}\` désactive les hooks git pour toute la suite de la session`;
    }

    const gitIndex = findGitIndex(words);
    if (gitIndex === -1) continue;

    const variable = words
      .slice(0, gitIndex)
      .find((word) => BYPASS_VARIABLES.some((pattern) => pattern.test(word)));
    if (variable) return `\`${variable}\` désactive les hooks git`;

    // Options globales de git (`git -c clé=valeur push`) avant la sous-commande.
    let index = gitIndex + 1;
    while (index < words.length && words[index].startsWith("-")) {
      if (words[index] === "-c" && words[index + 1]?.startsWith("core.hooksPath")) {
        return "`core.hooksPath` détourne les hooks git";
      }
      index += words[index] === "-c" || words[index] === "-C" ? 2 : 1;
    }

    const subcommand = words[index];
    if (!HOOKED_SUBCOMMANDS.has(subcommand)) continue;

    const options = words.slice(index + 1);
    if (options.includes("--no-verify"))
      return `\`git ${subcommand} --no-verify\` saute les hooks git`;
    // Pour `commit` seulement, `-n` vaut `--no-verify` ; pour `push`, c'est `--dry-run`.
    if (
      subcommand === "commit" &&
      options.some((option) => /^-[a-zA-Z]*n[a-zA-Z]*$/.test(option))
    ) {
      return "`git commit -n` (`--no-verify`) saute les hooks git";
    }
  }
  return undefined;
}
