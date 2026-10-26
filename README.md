# ETAPE

ETAPE permet à chaque salarié qui le désire de réussir sa transition professionnelle

## Design

Maquettes Figma : [Projet ETAPE](https://www.figma.com/files/team/1639194941001851083/project/604081677?fuid=1065179526289909504)

## Développement

Monorepo [Turborepo](https://turbo.build/) : deux sites Next.js en export statique, deux SPA Vite, une API NestJS et un thème Keycloak. Quel workspace sert à quoi, et où faire quoi : [docs/cartographie.md](docs/cartographie.md).

### Applications

| Application           | Description                    | Port (dev) |
| --------------------- | ------------------------------ | ---------- |
| `apps/site`           | Site vitrine                   | 3000       |
| `apps/simulateur`     | Simulateur d'éligibilité       | 3001       |
| `apps/front-office`   | Espace du bénéficiaire         | 5173       |
| `apps/back-office`    | Outil de l'instructeur         | 5174       |
| `apps/api`            | API d'authentification         | 3002       |
| `apps/keycloak-theme` | Écrans de connexion et d'email | —          |

Le site et le simulateur sont des exports statiques ; le front-office et le
back-office sont des SPA Vite, encore à l'état de scaffold. `apps/api` est un service
NestJS : il porte la connexion FranceConnect et les comptes locaux, tient la base
de données du service, et reste le seul composant à détenir des secrets. `apps/keycloak-theme` n'est pas un serveur
mais un thème Keycloak, construit en JAR et servi par Keycloak — voir
[docs/authentification.md](docs/authentification.md).

### Prérequis

- [Node.js](https://nodejs.org/) >= 24 (version épinglée dans `.nvmrc`)
- pnpm 11.28.6 (`packageManager` du `package.json`) : `npm install -g pnpm@11.28.6`,
  comme en CI. Un pnpm 10 ou plus déjà installé convient aussi : dans le dépôt, il
  passe de lui-même à la version de `packageManager`. `corepack enable pnpm` marche
  encore sous Node 24, mais Node 25 ne livre plus corepack.

### Installation

```bash
pnpm install
```

### Lancer le projet

```bash
# Tout l'environnement en une commande : choix des apps, vérification des .env
# et des ports, pile Docker (bases, Keycloak), migrations, puis les apps.
# Affiche leurs adresses une fois prêtes. `--all` lance tout sans demander.
pnpm run dev:stack

# Les apps seules (toutes via Turborepo), si la pile Docker tourne déjà ou
# n'est pas nécessaire
# → site : http://localhost:3000 · simulateur : http://localhost:3001
# → front-office : http://localhost:5173 · back-office : http://localhost:5174
pnpm run dev

# Générer l'export statique (SSG) de toutes les apps (dossier out/ de chaque app)
pnpm run build

# Linter
pnpm run lint
```

Pour ne cibler qu'une seule application, utilise le filtre Turborepo :

```bash
pnpm run dev --filter=@etape/site
pnpm run build --filter=@etape/simulateur
```

Le parcours de connexion demande en plus un Keycloak et une base PostgreSQL en
local, lancés par `docker compose up -d` (ou par `pnpm run dev:stack`) — voir
[docs/authentification.md](docs/authentification.md) pour le parcours et
[docs/donnees.md](docs/donnees.md) pour la base.

## Déploiement

La pile est décrite par [`docker-compose.prod.yml`](docker-compose.prod.yml) et
tient sur tout hébergeur capable de construire et lancer un `docker-compose`.
Variables d'environnement, identifiants FranceConnect et vérifications :
[docs/deploiement.md](docs/deploiement.md).

## Travailler avec Claude Code

Les conventions du projet sont portées par des règles et des skills versionnés — voir [`docs/conventions/outillage-agent.md`](./docs/conventions/outillage-agent.md). Chaque workspace a un `AGENTS.md` (importé par son `CLAUDE.md`) qui oriente les agents, et [`docs/cartographie.md`](./docs/cartographie.md) en est la vue d'ensemble. Une seule manipulation est à faire sur ton poste.

**Activer le serveur MCP `shadcn`.** Il donne accès aux sources officielles des composants shadcn, ce dont le skill `composant-ui` a besoin pour ne pas les retaper de mémoire. Le dépôt le déclare (`.mcp.json`) et l'autorise (`.claude/settings.json`), mais ton fichier personnel `.claude/settings.local.json` — non versionné — peut le désactiver :

```json
{ "disabledMcpjsonServers": ["shadcn"] }
```

Retire l'entrée `"shadcn"` de ce tableau. Sans cela, le serveur reste muet et le skill échoue sans dire pourquoi.

> Cette section a vocation à rejoindre le `CONTRIBUTING.md` prévu par l'issue #6.
