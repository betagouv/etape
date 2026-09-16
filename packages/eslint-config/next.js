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
  // `docs/conventions/typescript.md` : type de retour explicite sur les
  // fonctions exportées. Limité aux `.ts` : les composants React (`.tsx`)
  // gardent leur type de retour inféré. Les enums sont interdits par
  // `erasableSyntaxOnly` dans le `tsconfig.json` de chaque app.
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "error",
    },
  },
  /*
   * `docs/conventions/react.md` et `accessibilite.md` : ce que les outils
   * savent vérifier seuls passe en erreur.
   *
   * Les règles `jsx-a11y` sont activées par leur nom plutôt que par le preset
   * recommandé du plugin : celui-ci arrive par `eslint-config-next` et n'est
   * pas une dépendance déclarée d'`@etape/eslint-config`. Les activer une à
   * une évite de l'ajouter en dépendance directe, et dit exactement ce qu'on
   * impose. `eslint-config-next` n'en active que six, toutes en avertissement.
   */
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "react-hooks/exhaustive-deps": "error",

      // Nom accessible et libellés
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/control-has-associated-label": "error",
      "jsx-a11y/iframe-has-title": "error",
      "jsx-a11y/html-has-lang": "error",

      // ARIA valide
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/no-redundant-roles": "error",

      // Clavier et interactions
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/tabindex-no-positive": "error",
      "jsx-a11y/no-autofocus": "error",
    },
  },
  // Doit rester en dernier : neutralise les règles en conflit avec Prettier.
  eslintConfigPrettier,
  // Reprend les ignores par défaut d'eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
