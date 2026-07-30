/**
 * Anneau de focus clavier, pour les éléments qui ne passent pas par un composant
 * du design system (liens de navigation, liens de pied de page…).
 *
 * Un seul consommateur aujourd'hui (`SkipLinks`), mais la recette était déjà
 * recopiée à l'identique en trois endroits avant que l'en-tête et le pied de
 * page ne sortent du périmètre : la déclaration unique est là pour qu'ils s'y
 * raccrochent plutôt que de la réinventer.
 *
 * Volontairement limité au focus : le rayon reste au point d'appel, qui est le
 * seul à savoir quelle forme il a.
 *
 * Note : `Button` et `Badge` portent une variante plus riche (bordure teintée +
 * anneau semi-opaque, héritée de shadcn). Les aligner changerait leur apparence,
 * on ne les touche donc pas ici.
 */
export const focusRing =
  "focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:outline-none";
