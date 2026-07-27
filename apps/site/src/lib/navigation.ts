/**
 * Navigation du site : entrées du menu principal, liens d'évitement et
 * identifiants des repères (landmarks) que ces liens ciblent.
 *
 * Ce module est la source unique de vérité : l'en-tête, le menu mobile et le
 * layout s'y réfèrent, ce qui évite qu'un lien et sa cible divergent.
 */

/** Identifiant du contenu principal, cible du lien d'évitement « Contenu ». */
export const MAIN_CONTENT_ID = "contenu";

/** Identifiant de la navigation principale, cible du lien d'évitement « Menu ». */
export const MAIN_NAV_ID = "navigation-principale";

export type NavItem = {
  /** Libellé affiché dans le menu. */
  readonly label: string;
  /**
   * Destination : soit une route interne (« / », « /faq »…), soit une ancre
   * dans une page (« /#comment-ca-marche »).
   */
  readonly href: string;
};

/**
 * Entrées du menu principal, dans leur ordre d'affichage.
 *
 * « Les dispositifs » figure dans la maquette mais reste volontairement absent
 * tant que la page correspondante n'existe pas (demande explicite du ticket).
 */
export const MAIN_NAV: readonly NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "FAQ", href: "/#faq" },
];

/**
 * Liens d'évitement révélés à la première tabulation, sur le modèle de
 * service-public.fr (Système de design de l'État).
 */
export const SKIP_LINKS: readonly NavItem[] = [
  { label: "Contenu", href: `#${MAIN_CONTENT_ID}` },
  { label: "Menu", href: `#${MAIN_NAV_ID}` },
];

/**
 * Indique si une entrée du menu correspond à la page affichée.
 *
 * Les ancres sont exclues : elles désignent une section de la page courante et
 * ne constituent donc jamais une « page courante » au sens d'`aria-current`.
 * Sans cette exclusion, toutes les ancres de l'accueil seraient marquées comme
 * courantes en même temps que « Accueil ».
 */
export function isCurrentPage(href: NavItem["href"], pathname: string): boolean {
  return !href.includes("#") && href === pathname;
}
