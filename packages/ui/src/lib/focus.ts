/**
 * Anneau de focus clavier, pour les éléments qui ne passent pas par un composant
 * du design system (liens de navigation, liens d'évitement, liens de pied de
 * page…).
 *
 * Une seule déclaration, dans le package : recopiée au point d'appel, la recette
 * finit par diverger sans que rien ne le signale — et le repère visuel du clavier
 * doit rester rigoureusement identique d'un élément à l'autre, c'est une exigence
 * d'accessibilité, pas une préférence esthétique.
 *
 * `outline` plutôt que `ring` : le tracé suit l'élément sans jamais être rogné
 * par un ancêtre en `overflow: hidden`, et `outline-offset` le détache assez du
 * texte pour rester lisible sur fond coloré.
 *
 * Note : `Button` et `Badge` gardent la variante `ring` héritée de shadcn. La
 * frontière est assumée — composants habillés d'un côté, liens nus de l'autre —
 * et les aligner changerait l'apparence de tous les boutons.
 */
export const focusRing =
  "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2";
