# ETAPE

ETAPE permet à chaque salarié qui le désire de réussir sa transition professionnelle

## Design

Maquettes Figma : [Projet ETAPE](https://www.figma.com/files/team/1639194941001851083/project/604081677?fuid=1065179526289909504)

## Développement

Monorepo [Turborepo](https://turbo.build/) contenant le site vitrine Next.js (SSG) dans `apps/site`.

### Prérequis

- [Node.js](https://nodejs.org/) >= 20
- npm >= 10

### Installation

```bash
npm install
```

### Lancer le projet

```bash
# Serveur de développement (http://localhost:3000)
npm run dev

# Générer l'export statique (SSG) dans apps/site/out/
npm run build

# Linter
npm run lint
```
