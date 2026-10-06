<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# apps/simulateur — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md).

## Rôle

Simulateur d'éligibilité **public et anonyme** : un questionnaire déclaratif mène à des dispositifs, des interlocuteurs et des outils recommandés, exportables en PDF. Il **n'appelle pas l'API** ; tout son état vit dans le navigateur.

## Ici / ailleurs

- Ici : les questions, les règles de parcours, la sélection des résultats, le PDF.
- Ailleurs : un texte du site vitrine → `apps/site` ; un composant ou une variante → `packages/ui` (skill `composant-ui`) ; tout ce qui demande un compte → `apps/front-office`.

## Lancer et vérifier

Next 16 en export statique (`out/`), servi sous `/simulateur` (`basePath` tiré de `paths.mjs` à la racine). Port **3001** ; en dev, `/` redirige vers `/simulateur/`.

```bash
npm run dev -- --filter=@etape/simulateur
npm run lint --workspace=@etape/simulateur
npm run typecheck --workspace=@etape/simulateur
```

Aucun test pour l'instant (Vitest prévu sur le domaine : `stack-front.md`, décision 8).

## Où vivent les choses

- `src/questionnaire/domain/` — le moteur et son contenu, en fonctions pures : `types.ts` (`Question`, `Field`, `Answers`, `Outcome`), `questions.ts` (les questions et les `FIELD_*`), `flow.ts` (parcours), `conditions.ts`, `validation.ts`.
- `src/questionnaire/state/` — le store maison (reducer) ; `hooks/` — `useFlow`, `useFlowNavigation` ; `components/` — les vues.
- `src/resultats/domain/` — `catalogue.ts` (scénarios), `selection.ts`, `profil.ts` ; `components/` ; `pdf/` (seule exception documentée aux tokens de couleur).
- `src/app/` — les routes Next (accueil, `questionnaire/`).

C'est **le code de référence du front** : domaine pur, logique d'écran dans un hook, vues pures.

## Conventions

- `docs/conventions/react.md`, `stack-front.md` (le moteur déclaratif est conservé, décision 4 : passer à Zustand si le store cesse d'être local au questionnaire).
- ESLint `@etape/eslint-config/next` : les 21 règles `jsx-a11y` sont bloquantes ici.
- Nommage : mécanique en anglais (`Answers`, `Step`, `Outcome`), contenu métier en français (`FIELD_SITUATION`, `Profil`, `Resultat`).
