# packages/eslint-config — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md). Détail des presets et des règles propres au projet : [`README.md`](./README.md).

## Rôle

Les presets ESLint (flat config) du monorepo.

| Preset           | Workspaces                                                                    | `jsx-a11y`           |
| ---------------- | ----------------------------------------------------------------------------- | -------------------- |
| `base`           | `apps/api`, `packages/api-client`, `packages/api-contract`                    | —                    |
| `next`           | `apps/site`, `apps/simulateur`                                                | 21 règles, en erreur |
| `react-internal` | `packages/ui`, `apps/keycloak-theme`, `apps/front-office`, `apps/back-office` | aucune               |

## Ici / ailleurs

- Ici : toute règle qu'une machine sait vérifier seule. Une convention vérifiable descend à ce niveau (`docs/conventions/outillage-agent.md`).
- Ailleurs : le formatage → `packages/prettier-config` ; une règle de jugement (nommage, découpage) → `docs/conventions/` et la revue.

## Vérifier

Une modification se mesure sur tout le dépôt, sans cache : `npx turbo run lint --force`.
