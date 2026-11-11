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
 * ne sont lus comme des commandes ou des options. Seul compte un `git` en
 * position de commande, c'est-à-dire précédé uniquement d'affectations de
 * variables ou de `env` : un `echo git push --no-verify` ne fait que citer.
 */

/** Sous-commandes dont les hooks comptent. */
const HOOKED_SUBCOMMANDS = new Set(["push", "commit"]);

/** Variables qui désactivent les hooks quand elles préfixent la commande. */
const BYPASS_VARIABLES = [/^HUSKY=0$/, /^SKIP_AI_REVIEW=/];

const SEGMENT_SEPARATOR = /&&|\|\||[;|\n]/;

const QUOTED = /'[^']*'|"(?:\\.|[^"\\])*"/g;

/** Ce qui, dans une chaîne entre guillemets, ferait sinon changer de mot ou de commande. */
const QUOTED_BREAKS = /[\s;|&]/g;

/** Ce qui peut précéder `git` en position de commande : `VAR=valeur` ou `env`. */
const COMMAND_PREFIX = /^(env|[A-Za-z_][A-Za-z0-9_]*=.*)$/;

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

    const gitIndex = words.indexOf("git");
    if (gitIndex === -1) continue;

    const prefix = words.slice(0, gitIndex);
    if (!prefix.every((word) => COMMAND_PREFIX.test(word))) continue;
    const variable = prefix.find((word) => BYPASS_VARIABLES.some((pattern) => pattern.test(word)));
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
