/**
 * Liens et ancres de la page d'accueil.
 *
 * En-tête et pied de page sont hors périmètre (traités ailleurs) : ce module ne
 * porte donc plus de liste de navigation. Les sections conservent malgré tout
 * leurs ancres — `#comment-ca-marche`, `#pour-qui`, `#temoignages` — pour que la
 * navigation puisse s'y brancher sans avoir à les réintroduire.
 */

/**
 * Le simulateur est un build séparé, servi sous son propre préfixe : le site ne
 * peut pas résoudre ses routes et a besoin du préfixe pour construire ses liens.
 * Celui-ci vient de `paths.mjs` via `next.config.ts`, seule déclaration du
 * découpage des chemins.
 *
 * Volontairement sans valeur de repli : un préfixe absent doit produire une URL
 * manifestement cassée plutôt qu'un chemin d'apparence valide.
 */
export const SIMULATEUR_URL = `${process.env.NEXT_PUBLIC_SIMULATEUR_PATH}/`;

/**
 * Id du repère de contenu principal. Cible du lien d'évitement « Contenu » et du
 * bouton de retour en haut.
 */
export const CONTENT_ID = "contenu";
