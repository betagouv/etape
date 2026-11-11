/**
 * Repère, dans une commande shell, ce qui contourne les hooks git du dépôt
 * (`lint-staged` en pre-commit, typecheck et review IA en pre-push).
 *
 * Utilisé par `.claude/hooks/block-hook-bypass.mjs` pour qu'un agent ne
 * contourne pas ce qu'on impose aux humains. Côté humain, rien n'empêche
 * techniquement `--no-verify` : le levier y est social et mesuré.
 *
 * Volontairement simple : on découpe aux opérateurs du shell et on lit les mots,
 * sans interpréter les guillemets. Une commande qui ne fait que citer
 * `--no-verify` (un `grep` dans la doc) passe, puisqu'elle n'appelle pas
 * `git push` ni `git commit`.
 */

/** Sous-commandes dont les hooks comptent. */
const HOOKED_SUBCOMMANDS = new Set(["push", "commit"]);

/** Variables qui désactivent les hooks quand elles préfixent la commande. */
const BYPASS_VARIABLES = [/^HUSKY=0$/, /^SKIP_AI_REVIEW=/];

const SEGMENT_SEPARATOR = /&&|\|\||[;|\n]/;

/**
 * Rend la raison du refus, ou `undefined` si la commande ne contourne rien.
 *
 * @param {string} command
 * @returns {string | undefined}
 */
export function findHookBypass(command) {
  for (const segment of command.split(SEGMENT_SEPARATOR)) {
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
