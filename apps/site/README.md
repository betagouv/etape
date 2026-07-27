# @etape/site

Site vitrine ETAPE — application [Next.js](https://nextjs.org) en export statique (SSG).

## Installer et lancer

Depuis ce dossier (`apps/site`) :

```bash
# Installer les dépendances (à lancer de préférence depuis la racine du monorepo)
npm install

# Serveur de développement (http://localhost:3000)
npm run dev

# Générer l'export statique (SSG) dans out/
npm run build

# Linter
npm run lint
```

> Astuce : à la racine du monorepo, `npm run dev` et `npm run build` lancent ces commandes via Turborepo.

## Figma Code Connect

Les fichiers `*.figma.tsx` associent un composant Figma à son équivalent en code : dans Figma
(mode Développement), un designer voit alors le composant React à utiliser plutôt qu'un bloc CSS.
Ces fichiers ne sont jamais embarqués dans le bundle — ils ne sont importés par aucun composant.

La configuration vit dans `figma.config.json`. Vérifier que les associations sont lisibles ne
demande aucun accès distant :

```bash
npm run figma:check
```

Publier vers Figma requiert un [jeton d'accès personnel](https://www.figma.com/developers/api#access-tokens)
et un siège **mode Développement** sur le fichier :

```bash
FIGMA_ACCESS_TOKEN=<jeton> npm run figma:publish
```

Pour (re)générer une association à partir d'une URL Figma — c'est la voie à privilégier, car elle
résout l'instance vers son composant principal et découvre ses propriétés (variantes, textes) :

```bash
FIGMA_ACCESS_TOKEN=<jeton> npm run figma:create -- "<url-du-nœud-figma>"
```
