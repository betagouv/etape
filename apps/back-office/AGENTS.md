# apps/back-office — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md).

## Rôle

SPA qui portera l'outil d'**instruction des dossiers** pour les instructeurs Transitions Pro (`instructeur`). Les conseillers CEP n'ont pas d'app : demander avant d'en créer une ou de leur ouvrir celle-ci.

## Ici / ailleurs

- Ici : les écrans, les routes et la logique d'écran de cette app.
- Ailleurs : un écran pour le bénéficiaire → `apps/front-office` ; un composant ou une variante → `packages/ui` (skill `composant-ui`) ; l'appel HTTP commun → `packages/api-client` ; le contrat d'une route → `packages/api-contract`, puis `apps/api` (voir la route métier de bout en bout, `docs/cartographie.md` section 3).

## Lancer et vérifier

Vite 8 + React 19, TanStack Router (routes déclarées en code) et TanStack Query, react-hook-form + zod. Port **5174**. Build `tsc -b && vite build` → `dist/`.

```bash
cp .env.example .env
npm run dev -- --filter=@etape/back-office
npm run lint --workspace=@etape/back-office
npm run typecheck --workspace=@etape/back-office
```

Pas de script `test` pour l'instant.

## Où vivent les choses

- `src/main.tsx` — providers (`QueryClientProvider`, `RouterProvider`).
- `src/navigation/` — `router.ts` et `routes.tsx` (`createRootRoute` / `createRoute`). Pas de routage par fichiers : `tsc -b` tourne avant Vite et ne trouverait pas `routeTree.gen.ts` (`stack-front.md`, décision 12).
- `src/lib/http-client.ts` — instance axios issue de `createHttpClient` (`packages/api-client`) ; `src/lib/query-client.ts`.
- `src/App.tsx` — écran de démonstration, à remplacer.

## Conventions

- `docs/conventions/stack-front.md` (décision 12 pour ces deux apps), `react.md`, `accessibilite.md`.
- Toute donnée de l'API passe par TanStack Query, au-dessus du contrat de `packages/api-contract` — jamais de `fetch` dans un `useEffect`.
- ESLint `@etape/eslint-config/react-internal` : **les règles `jsx-a11y` ne s'appliquent pas ici** (point ouvert de `stack-front.md`). L'accessibilité repose sur la revue et `.claude/rules/accessibilite.md`.

## État et pièges

- **Scaffold** : un seul écran de démonstration, aucun appel à l'API. Ne pas le prendre pour un modèle — le code de référence du front est `apps/simulateur`.
- Le premier appel à l'API ne passera pas tel quel :
  - `VITE_API_BASE_URL` de `.env.example` n'a pas le préfixe `/api` de l'API (`http://localhost:3002/api`) ;
  - le CORS de l'API n'autorise que `FRONT_BASE_URL` (le site, port 3000) ;
  - les URI de redirection après déconnexion du realm Keycloak ne couvrent pas ce port.
- `onUnauthorized` (401) ne fait qu'un rechargement de page en attendant la vraie redirection vers Keycloak.
- `VITE_API_BASE_URL` est figée au build (déclarée dans `turbo.json`).
- Cette app n'est pas encore construite ni servie par le déploiement (`Dockerfile`, nginx).
