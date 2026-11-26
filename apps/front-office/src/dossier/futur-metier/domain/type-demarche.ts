import { PIECES_AUTRE_DESCRIPTION, TYPE_DEMARCHE_AUTRE } from "../../domain/demarche";

/** Les types de démarche de découverte proposés, dans l'ordre de la liste (transmise le 2026-11-18). */
export const TYPE_DEMARCHE = {
  IMMERSION: "immersion",
  RENCONTRE_PROFESSIONNEL: "rencontre-professionnel",
  ENQUETE_METIER: "enquete-metier",
  SALON: "salon",
  PORTES_OUVERTES: "portes-ouvertes",
  ATELIER_INFORMATION: "atelier-information",
  BENEVOLAT: "benevolat",
  RECHERCHES_DOCUMENTAIRES: "recherches-documentaires",
  AUTRE: TYPE_DEMARCHE_AUTRE,
} as const;

/** Un type de démarche, parmi ceux de `TYPE_DEMARCHE`. */
export type TypeDemarche = (typeof TYPE_DEMARCHE)[keyof typeof TYPE_DEMARCHE];

/** Libellé de chaque type de démarche. */
export const TYPE_DEMARCHE_LABEL: Record<TypeDemarche, string> = {
  [TYPE_DEMARCHE.IMMERSION]: "Immersion en entreprise (stage d’observation, PMSMP)",
  [TYPE_DEMARCHE.RENCONTRE_PROFESSIONNEL]: "Rencontre ou entretien avec un professionnel du métier",
  [TYPE_DEMARCHE.ENQUETE_METIER]: "Enquête métier (questions posées à plusieurs professionnels)",
  [TYPE_DEMARCHE.SALON]: "Salon, forum ou job dating",
  [TYPE_DEMARCHE.PORTES_OUVERTES]: "Journée portes ouvertes d’un organisme",
  [TYPE_DEMARCHE.ATELIER_INFORMATION]:
    "Atelier ou réunion d’information (France Travail, APEC, CIO…)",
  [TYPE_DEMARCHE.BENEVOLAT]: "Bénévolat ou activité exercée en dehors du travail",
  [TYPE_DEMARCHE.RECHERCHES_DOCUMENTAIRES]:
    "Recherches documentaires (fiches métiers, vidéos, sites spécialisés)",
  [TYPE_DEMARCHE.AUTRE]: "Autre",
};

/** Ce qui justifie chaque type de démarche, sur sa carte dans « Mes documents » (ticket 216). */
export const TYPE_DEMARCHE_PIECES_DESCRIPTION: Record<TypeDemarche, string> = {
  [TYPE_DEMARCHE.IMMERSION]:
    "Une synthèse de votre expérience, la convention de stage ou de PMSMP, une attestation de l’entreprise d’accueil, etc.",
  [TYPE_DEMARCHE.RENCONTRE_PROFESSIONNEL]:
    "Un compte rendu de l’échange, une attestation signée par le professionnel, etc.",
  [TYPE_DEMARCHE.ENQUETE_METIER]:
    "La synthèse de votre enquête : les personnes rencontrées et ce que vous en retenez.",
  [TYPE_DEMARCHE.SALON]:
    "Un compte rendu de votre visite : ce qu’elle vous a apporté, les personnes rencontrées, etc.",
  [TYPE_DEMARCHE.PORTES_OUVERTES]:
    "Un compte rendu de votre visite : la raison pour laquelle vous avez souhaité y aller, votre expérience et votre ressenti.",
  [TYPE_DEMARCHE.ATELIER_INFORMATION]:
    "Un compte rendu de votre rendez-vous : les informations récupérées et ce que vous y avez appris.",
  [TYPE_DEMARCHE.BENEVOLAT]: "Un compte rendu de ses actions.",
  [TYPE_DEMARCHE.RECHERCHES_DOCUMENTAIRES]:
    "Une synthèse de vos recherches et des sources consultées.",
  [TYPE_DEMARCHE.AUTRE]: PIECES_AUTRE_DESCRIPTION,
};
