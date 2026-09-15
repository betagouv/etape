# ETAPE

ETAPE permet à chaque salarié qui le désire de réussir sa transition professionnelle (Certif Pro / Transitions Pro).

Monorepo Turborepo :

- `apps/site` — site vitrine, Next.js (export statique)
- `apps/simulateur` — simulateur d'éligibilité, Next.js (export statique)
- `packages/ui`, `packages/eslint-config`, `packages/prettier-config` — composants et configuration partagés
- API NestJS + Prisma + PostgreSQL, authentification Keycloak / FranceConnect : en cours dans `apps/api` (PR #16)

Commandes : `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm run format:check` (vérifié en CI).

## Nommage — règle obligatoire

La langue suit la couche : **le domaine métier est en français, la technique en anglais.** Le français est réservé aux noms et aux états métier ; la grammaire du code reste en anglais.

- FR : tables, colonnes, entités, enums, modules et fichiers métier, routes API métier, events analytics, constantes métier (entièrement en français : `DELAI_RELANCE_CEP_JOURS`)
- EN : verbes (`create`, `find`, `submit`), préfixes booléens (`is`, `has`, `should`, `can`), qualificatifs (`current`, `count`, `by`), suffixes (`Service`, `Repository`, `Dto`, `Guard`), colonnes techniques (`id`, `created_at`), vocabulaire technique et d'authentification (`database`, `cache`, `token`, `migration`, `session`, `login`, `identityProvider`), constantes techniques
- Seul mélange autorisé dans un identifiant : **grammaire anglaise + nom métier français** (`findDossier`, `isBrouillon`, `currentDossier`) — jamais la grammaire en français (`estBrouillon`), jamais la traduction d'un terme du glossaire (`isDraft`, `user`)
- Jamais d'accent ni de cédille dans un identifiant · tables au singulier · clés étrangères en `<entite>_id` · booléens en `is_` / `has_` / `should_` / `can_` · dates métier en `date_<nom>` (`date_depot`)

**Avant de créer une entité, une table, un enum, un module ou une migration, lis `docs/conventions/nommage.md` en entier** — il contient la table de correspondance complète et les cas particuliers. Avant d'introduire un nouveau nom métier, vérifie `docs/conventions/glossaire.md` : s'il n'y figure pas, propose-le en ajout plutôt que d'inventer un synonyme.

Toute review de code inclut une vérification de cette convention (skill `convention-nommage`, commande `/review-nommage`).
