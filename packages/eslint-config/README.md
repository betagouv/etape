# `@etape/eslint-config`

Configurations ESLint (flat config, ESLint 9) partagées par tout le monorepo.
Le formatage est délégué à Prettier — voir [`@etape/prettier-config`](../prettier-config).

## Configs disponibles

| Export                                | Usage                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `@etape/eslint-config/base`           | Base TypeScript (js + typescript-eslint + turbo + prettier). Pour un package TS générique. |
| `@etape/eslint-config/next`           | Applications Next.js (`apps/*`).                                                           |
| `@etape/eslint-config/react-internal` | Librairies React internes hors Next.js (ex: `packages/ui`).                                |

## Règles propres au projet

Elles appliquent [`docs/conventions/typescript.md`](../../docs/conventions/typescript.md).

| Règle                                               | Configs                          | Portée                 | Effet                                                                                                         |
| --------------------------------------------------- | -------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `@typescript-eslint/explicit-module-boundary-types` | `base`, `next`, `react-internal` | `**/*.ts`              | Type de retour explicite sur les fonctions exportées. Les composants React (`.tsx`) gardent leur type inféré. |
| `no-restricted-syntax` (`TSEnumDeclaration`)        | `base`, `react-internal`         | tous les fichiers      | Pas d'`enum` : objet `as const` + type dérivé. Les apps Next.js l'imposent par `erasableSyntaxOnly`.          |
| `etape/no-hardcoded-literal`                        | `base`, `next`, `react-internal` | `**/src/**/*.{ts,tsx}` | Pas de chaîne en dur là où le type attend une union de chaînes littérales déclarée dans le dépôt (§3).        |

### `etape/no-hardcoded-literal`

Règle maison (`rules/no-hardcoded-literal.js`), la seule du dépôt qui lit les types : son bloc active `parserOptions.projectService` sur les fichiers de `src/`. Elle signale `status === "done"`, `case "done":` et `changeField("nomVoie", …)` quand le type attendu est une union comme `PdfStatus` ou `keyof ManualAdresseFields`. Elle laisse passer, volontairement :

- une chaîne comparée à un `string` quelconque (`event.key === "Enter"`) ;
- le discriminant d'une union (`kcContext.pageId === "login.ftl"`, `field?.type === "checkbox"`) et `typeof x === "string"` ;
- une union déclarée par une bibliothèque (`document.visibilityState`, la `position` de Radix) ;
- un argument passé à une fonction de bibliothèque (clés i18n de Keycloakify, `messagesPerField`, `useState`, assertions de Vitest) ;
- les attributs JSX (`variant="link"`) et la chaîne vide.

**ESLint doit tourner depuis la racine du workspace**, comme le font Turbo, `lint-staged` et le hook `.claude/hooks/eslint-fix.sh` : depuis un sous-dossier, le `projectService` ne trouve plus le tsconfig et chaque fichier sort en erreur d'analyse.

## Utilisation

Dans le `package.json` du projet :

```json
{
  "devDependencies": {
    "@etape/eslint-config": "*",
    "eslint": "^9"
  },
  "scripts": {
    "lint": "eslint"
  }
}
```

Puis dans `eslint.config.mjs` à la racine du projet :

```js
import { nextConfig } from "@etape/eslint-config/next";

export default nextConfig;
```

(remplacer par `baseConfig` / `reactInternalConfig` selon le type de projet).
