---
name: composant-ui
description: Procédure d'ajout ou d'extension d'un composant d'interface ETAPE - chercher l'existant dans packages/ui, récupérer la source officielle shadcn par le serveur MCP, étendre par variante cva plutôt que par className, brancher les tokens de globals.css, vérifier le focus et l'annonce. À utiliser avant de créer un composant, d'ajouter une variante, de reprendre l'apparence d'un composant existant, ou quand une maquette introduit un élément d'interface qui n'existe pas encore dans le design system.
---

# Ajouter ou étendre un composant d'interface

Règles de fond : `docs/conventions/react.md` section 4. Ce skill est la procédure.

## 1. Chercher avant d'écrire

Dans l'ordre, s'arrêter dès qu'une réponse suffit :

1. `packages/ui/src/components/` — le composant existe peut-être déjà (23 composants y vivent).
2. Ses variantes — `cva` déclare souvent déjà le cas voulu : `button.tsx` a 8 variantes et 9 tailles, `card.tsx`, `section.tsx`, `container.tsx`, `badge.tsx`, `tabs.tsx` en ont aussi.
3. Les tokens de `packages/ui/src/styles/globals.css` — pour un besoin de couleur, d'échelle typographique ou de rayon.
4. Radix, qui fournit le comportement et l'accessibilité des composants complexes.

Si le besoin est couvert : l'utiliser tel quel. Ne pas reproduire son apparence à la main.

## 2. Décider où le composant vit

- Utilisé par plus d'une app → `packages/ui/src/components/`.
- Propre à un seul écran → dans son app, à côté de l'écran.

## 3. Récupérer la source officielle (serveur MCP `shadcn`)

Pour un composant shadcn absent du dépôt, passer par le serveur MCP `shadcn` déclaré dans `.mcp.json` plutôt que d'écrire le composant de mémoire : il donne la source à jour, avec ses parties, ses `data-slot` et son câblage Radix.

> Si le serveur ne répond pas, vérifier `.claude/settings.local.json` : il peut contenir `disabledMcpjsonServers: ["shadcn"]`, qui le désactive. Voir `docs/conventions/outillage-agent.md`.

Adapter ensuite la source aux conventions du dépôt, sans la recopier telle quelle : tokens du projet, commentaires en français, aucune couleur en dur.

## 4. Étendre par variante, jamais par `className`

Un besoin d'apparence non couvert s'ajoute **dans le composant**, comme variante `cva`, avec un commentaire qui dit d'où elle vient (maquette, besoin métier) — c'est ce que font déjà `inverse` et `outline-primary` dans `button.tsx`.

Ce qui est interdit : passer depuis une app un `className` qui change couleur, fond, bordure, rayon ou hauteur. Le `className` d'une app ne fait que de la mise en page.

## 5. Brancher le composant au reste

- `data-slot` sur chaque partie, comme tous les composants existants.
- `className` fusionné par `cn()` en dernier argument, pour rester surchargeable.
- `focusRing` (`packages/ui/src/lib/focus.ts`) sur tout élément focusable qui n'est ni `Button` ni `Badge`.
- Une nouvelle échelle typographique s'ajoute **aussi** dans `FONT_SIZES` de `packages/ui/src/lib/utils.ts`, sans quoi `tailwind-merge` ne saura pas que deux classes de taille sont concurrentes.

## 6. Vérifier

- Clavier : l'élément est atteignable, le focus est visible, l'ordre est naturel.
- Lecteur d'écran : le nom accessible existe, un changement d'état est annoncé (`docs/conventions/accessibilite.md`).
- Thème sombre : le composant utilise des tokens, donc il suit — le vérifier quand même.
- `npm run lint` et `npm run typecheck`.

## Ce que ce skill ne fait pas

Il n'ajoute pas de seconde bibliothèque de composants : un besoin non couvert se résout avec Radix et nos styles (`docs/conventions/stack-front.md`, décision 6).
