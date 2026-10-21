# apps/front-office — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md).

## Rôle

SPA qui portera l'espace connecté du **bénéficiaire** (`beneficiaire`) : dépôt et suivi de son dossier. Les conseillers CEP n'ont pas d'app : demander avant d'en créer une ou de leur ouvrir celle-ci.

## Ici / ailleurs

- Ici : les écrans, les routes et la logique d'écran de cette app.
- Ailleurs : un écran pour l'instructeur → `apps/back-office` ; la session (garde de démarrage, inactivité, « Session expirée », écrans d'erreur) → `packages/session` ; un composant ou une variante → `packages/ui` (skill `composant-ui`) ; l'appel HTTP commun → `packages/api-client` ; le contrat d'une route → `packages/api-contract`, puis `apps/api` (voir la route métier de bout en bout, `docs/cartographie.md` section 3).

## Lancer et vérifier

Vite 8 + React 19, TanStack Router (routes déclarées en code) et TanStack Query, react-hook-form + zod. Port **5173**. Build `tsc -b && vite build` → `dist/`.

```bash
cp .env.example .env
npm run dev -- --filter=@etape/front-office
npm run lint --workspace=@etape/front-office
npm run typecheck --workspace=@etape/front-office
```

Pas de script `test` pour l'instant.

## Où vivent les choses

- `src/main.tsx` — monte `SessionApp` (`packages/session`) : cache, routeur et région `role="status"`.
- `src/navigation/` — `router.ts` (contexte du routeur : `apiBaseUrl`, `httpClient`, `queryClient` ; `AppErrorScreen` par défaut) et `routes.tsx`, dont chaque route s'accroche à `sessionRootRoute`. Pas de routage par fichiers : `tsc -b` tourne avant Vite et ne trouverait pas `routeTree.gen.ts` (`stack-front.md`, décision 12).
- `src/lib/clients.ts` — `httpClient` et `queryClient`, reliés par `createSessionClients` (`packages/api-client`) : un 401 expire la session.
- `src/App.tsx` — écran de démonstration, à remplacer.

## Conventions

- `docs/conventions/stack-front.md` (décision 12 pour ces deux apps), `react.md`, `accessibilite.md`.
- Toute donnée de l'API passe par TanStack Query, au-dessus du contrat de `packages/api-contract` — jamais de `fetch` dans un `useEffect`.
- ESLint `@etape/eslint-config/react-internal` : **les règles `jsx-a11y` ne s'appliquent pas ici** (point ouvert de `stack-front.md`). L'accessibilité repose sur la revue et `.claude/rules/accessibilite.md`.

## État et pièges

- **Scaffold** : un seul écran de démonstration ; seule la session appelle l'API. Ne pas le prendre pour un modèle — le code de référence du front est `apps/simulateur`.
- Toute l'app est derrière la connexion : sans session, la garde de `sessionRootRoute` part vers le formulaire de Keycloak. Il faut l'API et `docker compose up -d` (`docs/authentification.md`).
- `VITE_API_BASE_URL` est relative (`/api`) et figée au build (déclarée dans `turbo.json`). En local, le proxy de Vite la relaie à l'API sur la même origine : pas de CORS.
- Le proxy de `vite.config.ts` garde sa forme objet : la forme courte réécrit l'en-tête `Host`, auquel l'API reconnaît le front (421 sinon).
- Port fixe (`strictPort`) : l'API et le realm Keycloak attendent ce port au retour de la connexion et de la déconnexion.
- Aucune durée de session ici : la règle de chaque front vit dans l'API (`SESSION_POLICY_BY_FRONT`).
