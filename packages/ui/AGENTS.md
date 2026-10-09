# packages/ui — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md).

## Rôle

Le design system unique d'ETAPE : composants shadcn/ui (sur Radix) et tokens Tailwind 4. Consommé par `apps/site`, `apps/simulateur`, `apps/front-office`, `apps/back-office` et `apps/keycloak-theme`.

## Ici / ailleurs

- Ici : toute primitive d'interface, toute variante d'apparence, tout token de couleur, de rayon ou de typographie.
- Ailleurs : un composant propre à un seul écran d'une app (une section du site, un écran du questionnaire) reste dans cette app. Son apparence, en revanche, vient d'ici.

**Ajouter ou étendre un composant : skill `composant-ui`.** Il faut chercher l'existant, récupérer la source officielle par le serveur MCP `shadcn`, puis étendre par variante `cva`.

## Lancer et vérifier

Sources TypeScript sans build, importées telles quelles par les apps : `@etape/ui/components/<nom>`, `@etape/ui/lib/<nom>`, `@etape/ui/globals.css`.

```bash
npm run lint --workspace=@etape/ui
npm run typecheck --workspace=@etape/ui
```

Pas de dev server propre : on vérifie un composant dans une app qui l'utilise.

## Où vivent les choses

- `src/components/` — un fichier par composant : accordion, back-to-top, badge, button, callout, card, checkbox, container, dialog, dropdown-menu, form, input, label, prose, radio-group, section, select, separator, skip-links, sonner, tabs, textarea, theme-provider.
- `src/styles/globals.css` — **les tokens** : la seule source de couleur du dépôt.
- `src/lib/utils.ts` (`cn`), `src/lib/focus.ts`.
- `components.json` — configuration shadcn.

## Conventions

- `docs/conventions/react.md` §4. Résumé chargé automatiquement : `.claude/rules/design-system.md`.
- **Étendre, ne pas modifier** : un besoin d'apparence devient une variante `cva` dans le composant (voir `inverse` et `outline-primary` dans `button.tsx`). Une app ne passe en `className` que de la mise en page.
- Aucune couleur hors tokens : ni hexadécimal, ni `rgb()`.
- ESLint `@etape/eslint-config/react-internal` : **les règles `jsx-a11y` ne s'appliquent pas ici** (point ouvert de `outillage-agent.md`). Le focus et l'annonce se vérifient à la main (`accessibilite.md`).

## Pièges

- `package.json` exporte `./hooks/*`, mais le dossier `src/hooks/` n'existe pas.
- `dialog`, `dropdown-menu`, `form`, `tabs` et `textarea` existent mais aucune app ne les importe encore : les réutiliser plutôt que d'en écrire d'autres.
