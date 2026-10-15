# packages/api-client — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md).

## Rôle

La couche HTTP partagée des SPA (`apps/front-office`, `apps/back-office`). Elle fournit un client axios avec le cookie de session et une réaction unique au 401, une erreur typée et le `QueryClient`.

## Ici / ailleurs

- Ici : ce qui est commun à tous les appels (instance, intercepteurs, forme des erreurs).
- Ailleurs : le contrat d'une route → `packages/api-contract` ; les hooks TanStack Query d'un écran → l'app qui les utilise. Le site (`apps/site`) n'utilise pas ce package.

## Lancer et vérifier

Sources TypeScript sans build (`exports: "./src/index.ts"`), dépend d'axios et de `@tanstack/react-query`.

```bash
npm run lint --workspace=@etape/api-client
npm run typecheck --workspace=@etape/api-client
```

## Où vivent les choses

- `src/http-client.ts` — `createHttpClient(baseURL, { onUnauthorized })` : `withCredentials`, 401 → `onUnauthorized`, corps d'erreur → `ApiError`.
- `src/api-error.ts` — `ApiError`, `ApiErrorBody { code, message, correlationId? }` ; `src/is-api-error-body.ts`.
- `src/query-client.ts` — `createQueryClient()`.

## Conventions

- `docs/conventions/stack-front.md`, décisions 3, 5 et 12. ESLint `@etape/eslint-config/base` : type de retour explicite sur chaque export.

## Pièges

- Le code suppose que l'API renvoie l'en-tête `x-request-id` et un corps `ApiErrorBody`. **Elle ne le fait pas encore** : pas de pino ni de filtre d'exceptions dans `apps/api`.
- La gestion des sessions expirées reste à faire (TODO « ticket 112 » dans `http-client.ts`).
