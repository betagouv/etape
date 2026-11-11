import { fileURLToPath } from "node:url";

/**
 * Configuration Prettier partagée par tout le monorepo.
 *
 * Chaque projet la référence via le champ `"prettier": "@etape/prettier-config"`
 * de son `package.json`.
 *
 * `prettier-plugin-tailwindcss` trie automatiquement les classes Tailwind ; il
 * doit rester en dernier dans `plugins` (contrainte du plugin).
 *
 * Le plugin est désigné par son chemin, résolu depuis ce paquet : Prettier le
 * chercherait sinon depuis le projet qui lit la configuration, où pnpm ne
 * l'expose pas.
 *
 * @see https://prettier.io/docs/options
 * @type {import("prettier").Config}
 */
const config = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  plugins: [fileURLToPath(import.meta.resolve("prettier-plugin-tailwindcss"))],
};

export default config;
