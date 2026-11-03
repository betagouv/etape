# packages/api-contract — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md).

## Rôle

La seule chose que le front et l'API partagent : le **contrat de chaque route** (méthode, chemin, schémas zod des paramètres, du corps et de la réponse). Un même fichier sert à valider côté API et à typer côté front.

## Ici / ailleurs

- Ici : les définitions de route et leurs schémas zod, rangés par domaine métier (`src/dossier/dossier.routes.ts`, `dossier.schema.ts`…).
- Ailleurs : l'implémentation de la route → `apps/api` ; son appel → l'app front, avec TanStack Query sur `packages/api-client`.

## Lancer et vérifier

**Ne dépend que de zod** : ni NestJS, ni React, ni axios. Compilé par `tsc` dans `dist/`, que Node lit (condition d'export `node` : l'API, les tests) ; TypeScript et Vite lisent `src/`. Turbo le construit avant `dev` et `test`.

```bash
pnpm --filter @etape/api-contract run build
pnpm --filter @etape/api-contract run lint
pnpm --filter @etape/api-contract run typecheck
```

## Où vivent les choses

- `src/route-definition.ts` — `HTTP_METHODS`, `RouteDefinition` et les types `RouteParams`, `RouteQuery`, `RouteBody`, `RouteResponse`.
- `src/build-route-path.ts` — `buildRoutePath`.

## Conventions

- `docs/conventions/architecture-api.md`, décision 3, et `stack-front.md`, décision 5 (exemples de contrat).
- Noms des routes et des schémas : skill `convention-nommage` (route métier en français, grammaire en anglais).

## État

Routes : `auth/` (session) et `etablissement/` (recherche Sirene du volet « Ma situation professionnelle »). Un contrat s'écrit avec l'écran qui appelle la route, pas avant : ne pas en ajouter « pour préparer ».
