/**
 * Contenu du pied de page.
 *
 * Les libellés et destinations sont regroupés ici plutôt que dans le JSX : ce
 * sont des données éditoriales, appelées à changer indépendamment de la mise en
 * page (ouverture des pages légales, mise à jour des barèmes…).
 */

/** Identifiant du pied de page, cible du lien d'évitement « Pied de page ». */
export const FOOTER_ID = "pied-de-page";

/**
 * Destination neutre des liens dont la page n'existe pas encore. Les regrouper
 * derrière une constante permet de les retrouver d'un coup d'œil le jour où
 * elles seront branchées.
 */
const A_VENIR = "#";

export type FooterLink = {
  readonly label: string;
  readonly href: string;
  /**
   * Lien sortant : ouvert dans un nouvel onglet, avec mention explicite pour
   * les lecteurs d'écran.
   */
  readonly isExternal?: boolean;
};

/**
 * Site institutionnel Transitions Pro. Cité à deux endroits du pied de page
 * (« Liens utiles » et « Mise à jour »), d'où la constante partagée : l'URL ne
 * doit exister qu'une seule fois.
 */
export const TRANSITIONS_PRO: FooterLink = {
  label: "transitionspro.fr",
  href: "https://www.transitionspro.fr",
  isExternal: true,
};

/** Colonne « Liens utiles ». « À propos » a été retiré à la demande du ticket. */
export const USEFUL_LINKS: readonly FooterLink[] = [
  { label: "Glossaire", href: A_VENIR },
  { label: "Contact", href: "mailto:contact-etape@certif-pro.fr" },
  TRANSITIONS_PRO,
];

/** Colonne « Légal ». « Politique RGPD » a été retirée à la demande du ticket. */
export const LEGAL_LINKS: readonly FooterLink[] = [
  { label: "Mentions légales", href: A_VENIR },
  { label: "CGU", href: A_VENIR },
  { label: "Accessibilité : non conforme", href: A_VENIR },
];

/**
 * Colonne « Mise à jour ». La source est composée d'un intitulé et du lien
 * `TRANSITIONS_PRO` : seul le nom de domaine est cliquable, afin que
 * l'intitulé du lien décrive bien sa destination.
 */
export const SCALE_UPDATE_NOTE = "Barèmes à jour au 27/05/2026";
export const SCALE_SOURCE_LABEL = "Source :";

/** Description du service, en tête du pied de page. */
export const SERVICE_NAME = "Transitions Pro · Simulateur";
export const SERVICE_DESCRIPTION =
  "Outil informatif pour évaluer votre éligibilité aux dispositifs de transition professionnelle.";

/** Avertissement de bas de page, imposé par le ticket. */
export const DISCLAIMER =
  "Simulateur informatif - Aucun avis officiel. La Commission Paritaire de votre région reste seule décisionnaire.";
