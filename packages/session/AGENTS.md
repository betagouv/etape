# packages/session — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md).

## Rôle

La gestion de session commune aux SPA (`apps/front-office`, `apps/back-office`) : la route racine et sa garde de démarrage, l'aiguillage entre l'app, les avis de démarrage et le dialogue « Session expirée », les écrans d'erreur. Un seul exemplaire d'un mécanisme de sécurité : un correctif ne peut pas n'atteindre qu'une app.

## Ici / ailleurs

- Ici : l'assemblage, qui relie le routeur, `@etape/api-client` et `@etape/ui`.
- Ailleurs : la logique sans React ni routeur (décision d'accès, compteur anti-boucle, réaction au 401, messages) → `packages/api-client` ; les vues (dialogue, écrans d'avis) → `packages/ui` ; les écrans et les routes d'une app → l'app, accrochés à `sessionRootRoute`.

## Lancer et vérifier

Sources TypeScript sans build (`exports: "./src/index.ts"`).

```bash
npm run lint --workspace=@etape/session
npm run typecheck --workspace=@etape/session
```

## Où vivent les choses

- `src/session-root-route.tsx` — `sessionRootRoute` (garde `beforeLoad`, `SessionLayout`) et `SessionRouterContext`, que chaque app passe à `createRouter`.
- `src/error-screens.tsx` — `AppErrorScreen` (aussi `defaultErrorComponent` du routeur de chaque app), `NotFoundScreen`, `HOME_PATH`.

## Conventions

- `docs/conventions/stack-front.md`, `docs/conventions/react.md`. Fonctionnement de la session : `docs/authentification.md`.

## Pièges

- `VITE_API_BASE_URL` ne se lit que dans l'app (Vite) : elle arrive ici par le contexte du routeur (`apiBaseUrl`).
