<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# apps/site — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md).

## Rôle

Site vitrine **public** d'ETAPE, plus l'entrée du parcours de connexion : bouton « Se connecter » dans l'en-tête et page `/compte/` qui affiche la session.

## Ici / ailleurs

- Ici : les pages et les textes publics, l'en-tête, le pied de page, les mentions légales, l'affichage de la session.
- Ailleurs : le questionnaire d'éligibilité → `apps/simulateur` ; un écran du bénéficiaire connecté → `apps/front-office` ; l'écran de connexion lui-même → `apps/keycloak-theme` ; la logique de session → `apps/api`.

## Lancer et vérifier

Next 16 en export statique (`out/`). Port **3000**. `NEXT_PUBLIC_API_BASE_URL` est figée au build (`http://localhost:3002/api` en dev, `/api` en prod, voir `next.config.ts`).

```bash
npm run dev -- --filter=@etape/site
npm run lint --workspace=@etape/site
npm run typecheck --workspace=@etape/site
```

Le parcours de connexion demande en plus l'API et Keycloak : `docker compose up -d` (voir `docs/authentification.md`). Aucun test pour l'instant.

## Où vivent les choses

- `src/content/` — les textes (`home.ts`, `faq.ts`, `mentions-legales.ts`) ; on modifie un texte ici, pas dans le composant.
- `src/components/sections/` — les sections de la page d'accueil ; `src/components/` — en-tête, pied de page, navigation, menu de compte.
- `src/lib/auth.ts` (URL de connexion, `PublicSession`), `src/lib/use-session.ts` (appel de session par `fetch` maison — le site n'utilise pas `packages/api-client`).
- `*.figma.tsx` et `figma.config.json` — Figma Code Connect (voir le README).

## Conventions

- `docs/conventions/react.md`, `stack-front.md`, `accessibilite.md`.
- ESLint `@etape/eslint-config/next` : les 21 règles `jsx-a11y` sont bloquantes ici.
- Le pied de page reste cantonné à cette app (ni dans `packages/ui`, ni dans le simulateur) : décision PO. Les liens légaux sans page cible pointent volontairement sur `A_VENIR` (`#`, dans `src/lib/footer.ts`) : on ne les branche que quand leur page est livrée.
