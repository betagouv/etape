# ETAPE

ETAPE permet à chaque salarié qui le désire de réussir sa transition professionnelle (Certif Pro / Transitions Pro).

Monorepo Turborepo :

- `apps/site` — site vitrine, Next.js (export statique)
- `apps/simulateur` — simulateur d'éligibilité, Next.js (export statique)
- `packages/ui`, `packages/eslint-config`, `packages/prettier-config` — composants et configuration partagés
- API NestJS + Prisma + PostgreSQL, authentification Keycloak / FranceConnect : en cours dans `apps/api` (PR #16)

Commandes : `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run format:check` (vérifié en CI).

Messages de commit, titres et descriptions de PR : en français. Branches : préfixe anglais + description en français (`feat/mentions-legales`).

## Nommage — règle obligatoire

La langue suit la couche : **le domaine métier est en français, la technique en anglais.** Le français est réservé aux noms et aux états métier ; la grammaire du code reste en anglais.

- FR : tables, colonnes, entités, enums, modules et fichiers métier, routes API métier, events analytics, constantes métier (entièrement en français : `DELAI_RELANCE_CEP_JOURS`)
- EN : verbes (`create`, `find`, `submit`), préfixes booléens (`is`, `has`, `should`, `can`), qualificatifs (`current`, `count`, `by`), suffixes (`Service`, `Repository`, `Dto`, `Guard`), colonnes techniques (`id`, `created_at`), vocabulaire technique et d'authentification (`database`, `cache`, `token`, `migration`, `account`, `session`, `login`, `identityProvider`), constantes techniques
- Compte authentifié = `account` (technique), rôle métier = `beneficiaire`, `instructeur`, `conseiller` · mécanisme générique (moteur de questionnaire : `Answers`, `Step`, `Outcome`) en anglais, son contenu métier (`FIELD_SITUATION`, `Profil`, `Resultat`) en français
- Seul mélange autorisé dans un identifiant : **grammaire anglaise + nom métier français** (`findDossier`, `isBrouillon`, `currentDossier`) — jamais la grammaire en français (`estBrouillon`), jamais la traduction d'un terme du glossaire (`isDraft`, `user`)
- Jamais d'accent ni de cédille dans un identifiant · tables au singulier · clés étrangères en `<entite>_id` · booléens en `is_` / `has_` / `should_` / `can_` · dates métier en `date_<nom>` (`date_depot`)

**Avant de créer une entité, une table, un enum, un module ou une migration, lis `docs/conventions/nommage.md` en entier** — il contient la table de correspondance complète et les cas particuliers. Avant d'introduire un nouveau nom métier, vérifie `docs/conventions/glossaire.md` : s'il n'y figure pas, propose-le en ajout plutôt que d'inventer un synonyme.

## Typage et accessibilité — règles par défaut

- **Typage** (`docs/conventions/typescript.md`) : type de retour explicite sur les fonctions exportées d'un `.ts` ; valeurs finies en objet `as const` + type dérivé, jamais d'`enum` ; jamais de littéral en dur dans une condition ; correspondances en `Record<Type, …>` ; `useState` typé par l'union.
- **Accessibilité** (`docs/conventions/accessibilite.md`) : pas de `disabled` sur un bouton d'action asynchrone (`aria-disabled` + garde) ; changements d'état annoncés dans une région `role="status"` toujours montée.

Les règles détaillées se chargent depuis `.claude/rules/` quand un fichier concerné est lu.

## Stack et architecture

- **Front** (`docs/conventions/stack-front.md`) : Next.js en export statique (donc aucune Server Action), Tailwind + shadcn/ui, react-hook-form + zod pour les formulaires à venir, le moteur déclaratif du simulateur conservé.
- **API** (`docs/conventions/architecture-api.md`) : trois couches — HTTP, métier, accès aux données. Un type Prisma ne franchit pas la frontière HTTP ; un repository ne s'extrait qu'à la demande, pas par principe.

Les quatre documents de conventions (`stack-front.md`, `architecture-api.md`, `react.md`, `outillage-agent.md`) sont au statut **« Décidé »** depuis la réunion d'arbitrage du 22 septembre 2026 : chacun se termine par son **relevé d'arbitrage**, qui dit ce qui a été répondu, et par les rares points **restés ouverts** — l'instance Sentry, `trust proxy`, les porteurs de TanStack Query et de `packages/api-contract`, et le doublon éventuel entre `revue-front` et `review-pr`. Ne pas rouvrir une décision qui y figure comme tranchée.

## Pratiques de code front

- **React** (`docs/conventions/react.md`) : le métier reste dans `domain/`, la logique d'écran dans un hook, la vue pure ; `useEffect` réservé au monde extérieur ; six props maximum ; forage limité à deux niveaux.
- **Design system** (`docs/conventions/react.md`, section 4) : aucune couleur hors tokens ; on **étend par variante `cva`**, on ne modifie pas par `className` — celui d'une app ne fait que de la mise en page ; on cherche dans `packages/ui` avant d'écrire une primitive. Pour ajouter ou étendre un composant : skill `composant-ui`.

## Outillage des conventions

`docs/conventions/outillage-agent.md` dit où chaque convention est portée et ce qui la vérifie : ESLint et CI pour ce qu'une machine décide seule, `.claude/rules/` pour le contexte automatique, skills et sous-agents pour les procédures, `docs/conventions/` pour le raisonnement. **Une convention vérifiable automatiquement descend au niveau de la CI** : c'est le seul niveau qui couvre aussi les développeurs qui n'utilisent pas Claude Code.

## Revue de code

Toute review de code ou de PR passe par le skill `review-pr` : conventions de nommage, de typage et d'accessibilité, suivi des constats des revues précédentes, suggestions GitHub vérifiées, rien de posté sans validation. Pour un diff front, il s'appuie sur le sous-agent `revue-front`.
