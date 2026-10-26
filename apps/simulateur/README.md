# @etape/simulateur

Simulateur ETAPE — application [Next.js](https://nextjs.org) en export statique (SSG).

## Installer et lancer

Depuis ce dossier (`apps/simulateur`) :

```bash
# Installer les dépendances (à lancer de préférence depuis la racine du monorepo)
pnpm install

# Serveur de développement (http://localhost:3001)
pnpm run dev

# Générer l'export statique (SSG) dans out/
pnpm run build

# Linter
pnpm run lint
```

> Astuce : à la racine du monorepo, `pnpm run dev` et `pnpm run build` lancent ces commandes via Turborepo.
