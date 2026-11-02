# packages/analytics — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md).

## Rôle

La mesure d'audience Matomo de toutes les apps (`stats.beta.gouv.fr`), dans le cadre exempté de consentement : pages vues, clics mesurés, refus de la mesure (opt-out). Le seul endroit qui parle à Matomo.

## Ici / ailleurs

- Ici : la configuration, le catalogue des events, le chargement du tracker, la mesure des pages vues et des clics, le hook d'opt-out.
- Ailleurs : où brancher la mesure et quels éléments marquer → l'app (`layout.tsx` des apps Next, `main.tsx` des SPA) ; l'apparence de la case d'opt-out → l'app, avec `@etape/ui` ; le site ID → argument de build `MATOMO_SITE_ID` (`docs/deploiement.md`).

## Lancer et vérifier

Sources TypeScript sans build. Quatre points d'entrée, pour que chaque app n'importe que ce que sa pile peut charger :

| Import                     | Contenu                                                               | Pour                                    |
| -------------------------- | --------------------------------------------------------------------- | --------------------------------------- |
| `@etape/analytics`         | config, catalogue d'events, `analyticsEventProps`, états de l'opt-out | toutes, composants serveur compris      |
| `@etape/analytics/next`    | `MatomoAnalytics`, branché sur `usePathname()`                        | `apps/site`, `apps/simulateur`          |
| `@etape/analytics/router`  | `startRouterTracking`, pour TanStack Router                           | `apps/front-office`, `apps/back-office` |
| `@etape/analytics/opt-out` | `useAudienceOptOut`                                                   | un composant client                     |

```bash
pnpm --filter @etape/analytics run lint
pnpm --filter @etape/analytics run typecheck
pnpm --filter @etape/analytics run test
```

## Où vivent les choses

- `src/events.ts` — `ANALYTICS_EVENT`, le catalogue : chaque event y est listé avec la question à laquelle il répond. Un nouvel event s'ajoute ici, puis se marque dans l'app avec `analyticsEventProps`.
- `src/click-tracking.ts` — un écouteur de clic délégué au document mesure tout élément marqué `data-analytics-event`. Marche dans un composant serveur, garde la vue pure.
- `src/tracker.ts` — la file `_paq` : `loadTracker`, `trackEvent`, `trackPageView`, `createPathViewTracker` (pages vues des apps Next), `disableNonExemptFeatures`.
- `src/next.tsx` — `MatomoAnalytics` : une page vue par changement de chemin, `basePath` compris.
- `src/router.ts` — `startRouterTracking` : une page vue par changement de chemin, sur le **motif** de la route.
- `src/use-audience-opt-out.ts` — lit et bascule le refus (`optUserOut` / `forgetUserOptOut`).

## Conventions

- `docs/conventions/stack-front.md`, décision 10 (Matomo, exemption de consentement). Noms d'events : `snake_case` français (`docs/conventions/nommage.md`).

## Pièges

- **Aucune donnée personnelle** dans une URL, un titre, un event ou son libellé : c'est une condition de l'exemption. D'où le motif de route dans les SPA (`/dossiers/$dossierId`), jamais l'URL réelle.
- **Sans site ID, rien n'est chargé** : `push` ignore une commande quand la file `_paq` n'existe pas. Ne pas créer la file ailleurs que dans `enqueue`.
- **Pas de paquet d'intégration Matomo** : le tracker se charge à la main (`loadTracker`), pour les apps Next comme pour les SPA. `@socialgouv/matomo-next`, essayé d'abord, est publié en CommonJS et embarquait `next/router`, son proxy serveur et ses A/B tests dans chaque page du site et du simulateur (+27 Ko gzip, mesure désactivée comprise), pour une trentaine de lignes de logique utile.
- **`./next` importe `next/navigation`** : il ne doit jamais atteindre `src/index.ts`, `src/router.ts` ni un bundle Vite.
- **Le point d'entrée racine ne contient aucun hook** : il est importé par des composants serveur (`layout.tsx`, contenus du site), où Next refuse `useState`.
- **Les paramètres d'URL ne font pas de page vue** dans les apps Next : les étapes du simulateur se mesurent dans `useScreenViewTracking`.
