# packages/prettier-config — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md). Détail : [`README.md`](./README.md).

## Rôle

La configuration Prettier unique du dépôt (`index.js`, avec `prettier-plugin-tailwindcss`), référencée par le champ `"prettier"` du `package.json` racine et de chaque workspace.

## Vérifier

`npm run format:check` à la racine, bloquant en CI ; `npm run format` pour corriger. Changer une option reformate tout le dépôt : à faire dans une PR dédiée.
