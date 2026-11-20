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
pnpm --filter @etape/ui run lint
pnpm --filter @etape/ui run typecheck
```

Pas de dev server propre : on vérifie un composant dans une app qui l'utilise.

## Où vivent les choses

- `src/components/` — un fichier par composant : accordion, back-to-top, badge, button, calendar, callout, card, character-count-textarea, checkbox, combobox, container, dialog, dropdown-menu, field, file-upload, form-field, form-radio-group, form-section, form-select, input, input-group, label, popover, prose, radio-group, remote-search-field, section, select, selection-card, separator, skip-links, sonner, tabs, tag, textarea, theme-provider.
- `src/styles/globals.css` — **les tokens** : la seule source de couleur du dépôt.
- `src/lib/utils.ts` (`cn`), `src/lib/focus.ts`, `src/lib/keys.ts` (`KEY`, les touches du clavier), `src/lib/join-ids.ts` (`joinIds`, les `id` d'un `aria-describedby`), `src/lib/option-value.ts` (`isOptionValue`, une chaîne ramenée au type des valeurs proposées), `src/lib/dragged-files.ts` (`hasDraggedFiles`, ce qu'on glisse contient-il des fichiers).
- `src/lib/remote-search.ts` — le contrat de `remote-search-field.tsx` (états `SEARCH_STATUS`, état de la recherche, textes) : l'app calcule l'état, le composant l'affiche.
- `src/hooks/` — `use-listbox-navigation.ts` : flèches, Entrée et Échap d'une liste d'options, le comportement qui va avec les parties de `combobox.tsx` ; `use-entry-mode.ts` : le passage d'un mode de saisie à l'autre (recherche ou saisie manuelle) autour de `remote-search-field.tsx` ; `use-file-upload.ts` : le contexte que lisent les parties de `file-upload.tsx` ; `use-focus-leave.ts` : prévenir quand le focus quitte un conteneur pour de bon, portails compris. Import : `@etape/ui/hooks/<nom>`.
- `components.json` — configuration shadcn.

## Conventions

- `docs/conventions/react.md` §4. Résumé chargé automatiquement : `.claude/rules/design-system.md`.
- **Étendre, ne pas modifier** : un besoin d'apparence devient une variante `cva` dans le composant (voir `inverse` et `outline-primary` dans `button.tsx`). Une app ne passe en `className` que de la mise en page.
- Aucune couleur hors tokens : ni hexadécimal, ni `rgb()`.
- ESLint `@etape/eslint-config/react-internal` : **les règles `jsx-a11y` ne s'appliquent pas ici** (point ouvert de `outillage-agent.md`). Le focus et l'annonce se vérifient à la main (`accessibilite.md`).

## Pièges

- `dialog`, `dropdown-menu`, `tabs` et `textarea` existent mais aucune app ne les importe encore (`textarea` sert seulement à `input-group`) : les réutiliser plutôt que d'en écrire d'autres. Un formulaire react-hook-form passe par `FormField`, qui relie libellé, description et erreur au champ.
