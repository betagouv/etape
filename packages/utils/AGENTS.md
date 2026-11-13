# packages/utils — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md).

## Rôle

Les **fonctions pures partagées par l'API et les fronts**, sans React, sans métier, sans dépendance. Aujourd'hui : la normalisation de texte (`stripDiacritics`, `normalizeForSearch`), pour qu'une recherche ne dépende ni des accents, ni de la casse, ni de la forme Unicode de la saisie.

## Ici / ailleurs

- Ici : une fonction utile à au moins deux workspaces, qui ne connaît ni le DOM, ni HTTP, ni une entité métier.
- Ailleurs : une règle métier → le `domain/` de l'app concernée ; un contrat de route → `packages/api-contract` ; l'appel HTTP → `packages/api-client` ; un composant → `packages/ui`.

**Ne pas en faire un fourre-tout** : une fonction n'entre ici qu'au second appelant, pas « pour préparer ». Chaque appelant garde ses règles propres (casse, ponctuation) et n'importe que le tronc commun.

## Lancer et vérifier

**Aucune dépendance.** Compilé par `tsc` dans `dist/`, que Node lit (condition d'export `node` : l'API, ses tests) ; TypeScript et Vite lisent `src/`. Turbo le construit avant `dev` et `test`, et le recompile à chaque modification pendant `pnpm run dev --filter=@etape/api`.

```bash
pnpm --filter @etape/utils run build
pnpm --filter @etape/utils run test
pnpm --filter @etape/utils run lint
pnpm --filter @etape/utils run typecheck
```

## Où vivent les choses

- `src/text.ts` — `stripDiacritics` (NFD puis retrait des marques combinantes) et `normalizeForSearch` (accents puis minuscule), tests à côté. Importé par `@etape/utils/text`. La ponctuation reste à chaque appelant : les régions fusionnent les séparateurs en espace, les codes APE suppriment points et espaces.
- **Un sous-chemin d'export par thème** (`exports` du `package.json`), pas de `index.ts` : le package n'a ainsi aucun import relatif. Turbopack (simulateur) ne résout pas `./text.js` vers un `.ts` hors de l'app, et les apps refusent l'extension `.ts` au typecheck.

## Conventions

- Noms en anglais : tout ici est technique (`docs/conventions/nommage.md`).
- Type de retour explicite sur chaque fonction exportée (`docs/conventions/typescript.md`).
