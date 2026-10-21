# packages/api-contract — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md).

## Rôle

La seule chose que le front et l'API partagent : le **contrat de chaque route** (méthode, chemin, schémas zod des paramètres, du corps et de la réponse). Un même fichier sert à valider côté API et à typer côté front.

## Ici / ailleurs

- Ici : les définitions de route et leurs schémas zod, rangés par domaine métier (`src/dossier/dossier.routes.ts`, `dossier.schema.ts`…).
- Ailleurs : l'implémentation de la route → `apps/api` ; son appel → l'app front, avec TanStack Query sur `packages/api-client`.

## Lancer et vérifier

Sources TypeScript sans build, **ne dépend que de zod** : ni NestJS, ni React, ni axios.

```bash
npm run lint --workspace=@etape/api-contract
npm run typecheck --workspace=@etape/api-contract
```

## Où vivent les choses

- `src/route-definition.ts` — `HTTP_METHODS`, `RouteDefinition` et les types `RouteParams`, `RouteQuery`, `RouteBody`, `RouteResponse`.
- `src/build-route-path.ts` — `buildRoutePath`.

## Conventions

- `docs/conventions/architecture-api.md`, décision 3, et `stack-front.md`, décision 5 (exemples de contrat).
- Noms des routes et des schémas : skill `convention-nommage` (route métier en français, grammaire en anglais).

## État

**Squelette vide volontaire** : aucune route, aucun consommateur. La première route s'écrit avec le premier vrai écran qui appelle l'API, pas avant. Ne pas ajouter de contrat « pour préparer ».
