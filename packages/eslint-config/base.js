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
      // `docs/conventions/typescript.md` : valeurs finies en objet `as const`.
      // Les apps Next.js l'imposent par `erasableSyntaxOnly` ; ici la règle
      // couvre aussi l'API NestJS, dont les propriétés de paramètre de
      // constructeur excluent cette option.
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSEnumDeclaration",
          message:
            "Pas d'enum TypeScript : objet `as const` + type dérivé (docs/conventions/typescript.md).",
        },
      ],
    },
  },
  // `docs/conventions/typescript.md` : type de retour explicite sur les
  // fonctions exportées. Limité aux `.ts` : les composants React (`.tsx`)
  // gardent leur type de retour inféré.
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "error",
    },
  },
  // Doit rester en dernier : neutralise les règles en conflit avec Prettier.
  eslintConfigPrettier,
  globalIgnores(["**/node_modules/**", "**/dist/**", "**/.turbo/**"]),
]);
