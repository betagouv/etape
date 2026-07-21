/**
 * Configuration Prettier partagée par tout le monorepo.
 *
 * Chaque projet la référence via le champ `"prettier": "@etape/prettier-config"`
 * de son `package.json`.
 *
 * `prettier-plugin-tailwindcss` trie automatiquement les classes Tailwind ; il
 * doit rester en dernier dans `plugins` (contrainte du plugin).
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
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
