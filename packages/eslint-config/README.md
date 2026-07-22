# `@etape/eslint-config`

Configurations ESLint (flat config, ESLint 9) partagées par tout le monorepo.
Le formatage est délégué à Prettier — voir [`@etape/prettier-config`](../prettier-config).

## Configs disponibles

| Export                                | Usage                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `@etape/eslint-config/base`           | Base TypeScript (js + typescript-eslint + turbo + prettier). Pour un package TS générique. |
| `@etape/eslint-config/next`           | Applications Next.js (`apps/*`).                                                           |
| `@etape/eslint-config/react-internal` | Librairies React internes hors Next.js (ex: `packages/ui`).                                |

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
