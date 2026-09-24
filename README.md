# ETAPE

ETAPE permet à chaque salarié qui le désire de réussir sa transition professionnelle

## Design

Maquettes Figma : [Projet ETAPE](https://www.figma.com/files/team/1639194941001851083/project/604081677?fuid=1065179526289909504)

## Développement

Monorepo [Turborepo](https://turbo.build/) regroupant plusieurs applications Next.js (SSG).

### Applications

| Application           | Description                    | Port (dev) |
| --------------------- | ------------------------------ | ---------- |
| `apps/site`           | Site vitrine                   | 3000       |
| `apps/simulateur`     | Simulateur d'éligibilité       | 3001       |
| `apps/api`            | API d'authentification         | 3002       |
| `apps/keycloak-theme` | Écrans de connexion et d'email | —          |

Le site et le simulateur sont des exports statiques. `apps/api` est un service
NestJS : il porte la connexion FranceConnect et les comptes locaux, tient la base
de données du service, et reste le seul composant à détenir des secrets. `apps/keycloak-theme` n'est pas un serveur
mais un thème Keycloak, construit en JAR et servi par Keycloak — voir
[docs/authentification.md](docs/authentification.md).

### Prérequis

- [Node.js](https://nodejs.org/) >= 24 (version épinglée dans `.nvmrc`)
- npm 11.17.0 (`packageManager` du `package.json`)

### Installation

```bash
npm install
```

### Lancer le projet

```bash
# Serveur de développement (toutes les apps via Turborepo)
# → site : http://localhost:3000 · simulateur : http://localhost:3001
npm run dev

# Générer l'export statique (SSG) de toutes les apps (dossier out/ de chaque app)
npm run build

# Linter
npm run lint
```

Pour ne cibler qu'une seule application, utilise le filtre Turborepo :

```bash
npm run dev -- --filter=@etape/site
npm run build -- --filter=@etape/simulateur
```

Le parcours de connexion demande en plus un Keycloak et une base PostgreSQL en
local, lancés par `docker compose up -d` — voir
[docs/authentification.md](docs/authentification.md) pour le parcours et
[docs/donnees.md](docs/donnees.md) pour la base.

## Déploiement

La pile est décrite par [`docker-compose.prod.yml`](docker-compose.prod.yml) et
tient sur tout hébergeur capable de construire et lancer un `docker-compose`.
Variables d'environnement, identifiants FranceConnect et vérifications :
[docs/deploiement.md](docs/deploiement.md).

## Travailler avec Claude Code

Les conventions du projet sont portées par des règles et des skills versionnés — voir [`docs/conventions/outillage-agent.md`](./docs/conventions/outillage-agent.md). Une seule manipulation est à faire sur ton poste.

**Activer le serveur MCP `shadcn`.** Il donne accès aux sources officielles des composants shadcn, ce dont le skill `composant-ui` a besoin pour ne pas les retaper de mémoire. Le dépôt le déclare (`.mcp.json`) et l'autorise (`.claude/settings.json`), mais ton fichier personnel `.claude/settings.local.json` — non versionné — peut le désactiver :

```json
{ "disabledMcpjsonServers": ["shadcn"] }
```

Retire l'entrée `"shadcn"` de ce tableau. Sans cela, le serveur reste muet et le skill échoue sans dire pourquoi.

> Cette section a vocation à rejoindre le `CONTRIBUTING.md` prévu par l'issue #6.
