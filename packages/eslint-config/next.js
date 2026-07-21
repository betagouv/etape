import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * Configuration ESLint pour les applications Next.js du monorepo.
 *
 * S'appuie directement sur `eslint-config-next` (qui embarque déjà
 * TypeScript, React et React Hooks) plutôt que sur la config `base` afin
 * d'éviter de déclarer deux fois le plugin `@typescript-eslint`.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const nextConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { turbo: turboPlugin },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  // Doit rester en dernier : neutralise les règles en conflit avec Prettier.
  eslintConfigPrettier,
  // Reprend les ignores par défaut d'eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
