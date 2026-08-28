/**
 * Navigation du site : entrées du menu principal, liens d'évitement et
 * identifiants des repères (landmarks) que ces liens ciblent.
 *
 * Ce module est la source unique de vérité : l'en-tête, le menu mobile et le
 * layout s'y réfèrent, ce qui évite qu'un lien et sa cible divergent.
 */

import { FOOTER_ID } from "@/lib/footer";

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
 * Le menu reste celui de la maquette, réduit aux entrées dont la cible existe :
 * « Les dispositifs » y figure mais son bloc a été écarté du périmètre, et le
 * garder produirait un lien mort, non conforme au RGAA. À rétablir quand la
 * section ou la page correspondante existera.
 *
 * On n'invente pas d'entrée pour autant : les sections « Pour qui » et
 * « Témoignages » ont bien une ancre, mais le design ne les met pas au menu.
 */
export const MAIN_NAV: readonly NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "FAQ", href: "/#faq" },
];

/**
 * Liens d'évitement révélés à la première tabulation, sur le modèle de
 * service-public.fr (Système de design de l'État), qui propose « Contenu »,
 * « Menu » puis « Pied de page ».
 */
export const SKIP_LINKS: readonly NavItem[] = [
  { label: "Contenu", href: `#${MAIN_CONTENT_ID}` },
  { label: "Menu", href: `#${MAIN_NAV_ID}` },
  { label: "Pied de page", href: `#${FOOTER_ID}` },
];

function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * Indique si une entrée du menu correspond à la page affichée.
 *
 * Les ancres sont exclues : elles désignent une section de la page courante et
 * ne constituent donc jamais une « page courante » au sens d'`aria-current`.
 * Sans cette exclusion, toutes les ancres de l'accueil seraient marquées comme
 * courantes en même temps que « Accueil ».
 */
export function isCurrentPage(href: NavItem["href"], pathname: string): boolean {
  return !href.includes("#") && normalizePath(href) === normalizePath(pathname);
}
