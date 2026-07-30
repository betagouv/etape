/**
 * Anneau de focus clavier des liens nus (navigation, évitement, pied de page).
 * Déclaration unique : le repère visuel du clavier doit rester identique partout.
 *
 * `outline` plutôt que `ring` : jamais rogné par un ancêtre en `overflow: hidden`.
 * `Button` et `Badge` gardent la variante `ring` de shadcn — les aligner
 * changerait l'apparence de tous les boutons.
 */
export const focusRing =
  "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2";
