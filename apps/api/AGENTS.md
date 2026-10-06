# apps/api — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md).

## Rôle

API NestJS d'ETAPE : connexion FranceConnect et comptes locaux (via Keycloak), sessions, base applicative. **Seul composant à détenir des secrets.** Appelée par le site et, demain, par le front-office et le back-office.

## Ici / ailleurs

- Ici : les modules métier (dossier, etc.), l'authentification, l'accès à `app-db` par Prisma.
- Ailleurs : le contrat d'une route (méthode, chemin, schémas zod) → `packages/api-contract`, **avant** le contrôleur ; les écrans de connexion → `apps/keycloak-theme` ; un client OIDC ou une URI de redirection → `keycloak/realms/etape-realm.json`.

## Lancer et vérifier

NestJS 12 (ESM), Prisma 7 + `@prisma/adapter-pg`, PostgreSQL. Port **3002**, préfixe global `/api`.

```bash
docker compose up -d                       # app-db, Keycloak et keycloak-db
cp .env.example .env
npm run db:migrate --workspace=@etape/api  # à rejouer après chaque migration
npm run dev -- --filter=@etape/api
npm run test --workspace=@etape/api        # Vitest, bloquant en CI
npm run typecheck --workspace=@etape/api
```

`app-db` est la seule base que l'API touche. `keycloak-db` appartient à Keycloak : ne jamais y écrire.

## Où vivent les choses

- `src/main.ts` — bootstrap (CORS limité à `FRONT_BASE_URL`, `trust proxy`, helmet) ; `src/app.module.ts`.
- `src/config/env.ts` — schéma zod des variables d'environnement.
- `src/database/` — `PrismaService` (module global).
- `src/auth/` — les 4 routes `GET /api/auth/login|callback|logout|session`, OIDC, `session/` (chiffrement du cookie, garde, store). **Code de référence de l'API**, tests à côté du code (`*.test.ts`).
- `src/account/` — `AccountService`.
- `prisma/schema.prisma` — modèles `Account` et `Session` ; `prisma/migrations/`. Le client est généré dans `src/generated/prisma` (ignoré par le lint).

Aucun module métier n'existe encore : le découpage cible est dans `architecture-api.md`, « Découpage des dossiers ».

## Conventions

- **`docs/conventions/architecture-api.md`** — trois couches (contrôleur → service → repository), repository abstrait par module, un type Prisma ne franchit jamais la frontière HTTP. Résumé chargé automatiquement : `.claude/rules/api.md`.
- **Avant toute table, colonne, enum, module ou migration : lire `docs/conventions/nommage.md` en entier** (skill `convention-nommage`) et vérifier `glossaire.md`.
- `docs/authentification.md` (parcours) et `docs/donnees.md` (base : Keycloak fait foi, `account` et `session` sont une projection).
- ESLint `@etape/eslint-config/base`.

## État et pièges

- Pas encore en place : filtre d'exceptions global, journaux pino et `correlationId`, Sentry, pipe de validation (choix resté ouvert). Ne pas supposer que l'en-tête `x-request-id` ou le corps `ApiErrorBody` attendus par `packages/api-client` sont déjà produits.
- `packages/api-contract` n'est encore importé nulle part : la première route métier l'amorce.
- `typecheck` et `test` lancent `prisma generate` : un `src/generated/` absent n'est pas une erreur.
