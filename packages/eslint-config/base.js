import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * Configuration ESLint de base, partagée par tous les projets du monorepo.
 *
 * Le formatage est délégué à Prettier : `eslint-config-prettier` (placé en
 * dernier) désactive toutes les règles de style qui entreraient en conflit.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const baseConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { turbo: turboPlugin },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  // Doit rester en dernier : neutralise les règles en conflit avec Prettier.
  eslintConfigPrettier,
  globalIgnores(["**/node_modules/**", "**/dist/**", "**/.turbo/**"]),
]);
