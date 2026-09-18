---
paths:
  - "apps/**/*.tsx"
  - "packages/ui/**/*.tsx"
---

# Design system — règles par défaut

Référence complète : `docs/conventions/react.md`, section 4. Procédure d'ajout d'un composant : skill `composant-ui`.

1. **Aucune couleur hors des tokens** de `packages/ui/src/styles/globals.css`. Pas de valeur hexadécimale, pas de `rgb()`. Seule exception documentée : les styles du PDF (`resultats/pdf/pdf-styles.ts`).
2. **Étendre, ne pas modifier** : un besoin d'apparence non couvert s'ajoute comme variante `cva` **dans le composant** de `packages/ui`, puis s'utilise partout. Voir les variantes maison de `button.tsx` (`inverse`, `outline-primary`).
3. **Le `className` d'une app ne fait que de la mise en page** : largeur, marge, `gap`, `flex`. Couleur, fond, bordure, rayon et hauteur appartiennent au composant.
4. **Chercher avant d'écrire** : `Container` plutôt qu'un `max-w-[…]`, `text-h1` plutôt qu'un `text-[28px]`, `Card` plutôt qu'un `<article>` stylé, `BackToTop` plutôt qu'un second bouton de remontée.
5. **Un composant partagé vit dans `packages/ui`** avec `data-slot`, `cn()`, ses variantes en `cva`, et `focusRing` pour tout élément focusable qui n'est ni `Button` ni `Badge`.

Aucun outil ne vérifie les points 2 à 4 : ils se constatent en revue.
