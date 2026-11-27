import { PIECES_AUTRE_DESCRIPTION, TYPE_DEMARCHE_AUTRE } from "../../domain/demarche";

/** Les types de démarche de construction du projet proposés, dans l'ordre de la liste (transmise le 2026-11-24). */
export const TYPE_DEMARCHE = {
  BILAN_COMPETENCES: "bilan-competences",
  BILAN_CARRIERE: "bilan-carriere",
  VAE: "vae",
  PRESTATION_ORIENTATION: "prestation-orientation",
  COACHING_RECONVERSION: "coaching-reconversion",
  AUTRE: TYPE_DEMARCHE_AUTRE,
} as const;

/** Un type de démarche, parmi ceux de `TYPE_DEMARCHE`. */
export type TypeDemarche = (typeof TYPE_DEMARCHE)[keyof typeof TYPE_DEMARCHE];

/** Libellé de chaque type de démarche. */
export const TYPE_DEMARCHE_LABEL: Record<TypeDemarche, string> = {
  [TYPE_DEMARCHE.BILAN_COMPETENCES]: "Bilan de compétences",
  [TYPE_DEMARCHE.BILAN_CARRIERE]: "Bilan de carrière (ou bilan professionnel)",
  [TYPE_DEMARCHE.VAE]: "VAE (validation des acquis de l’expérience)",
  [TYPE_DEMARCHE.PRESTATION_ORIENTATION]: "Prestation d’orientation France Travail",
  [TYPE_DEMARCHE.COACHING_RECONVERSION]: "Coaching en reconversion professionnelle",
  [TYPE_DEMARCHE.AUTRE]: "Autre",
};

/** Ce qui justifie chaque type de démarche, sur sa carte dans « Mes documents » (ticket 216). */
export const TYPE_DEMARCHE_PIECES_DESCRIPTION: Record<TypeDemarche, string> = {
  [TYPE_DEMARCHE.BILAN_COMPETENCES]: "La synthèse du bilan remise par l’organisme.",
  [TYPE_DEMARCHE.BILAN_CARRIERE]: "Le compte rendu ou la synthèse du bilan.",
  [TYPE_DEMARCHE.VAE]: "La notification de recevabilité, ou l’attestation de la démarche en cours.",
  [TYPE_DEMARCHE.PRESTATION_ORIENTATION]:
    "L’attestation de suivi, ou la synthèse remise par France Travail.",
  [TYPE_DEMARCHE.COACHING_RECONVERSION]: "L’attestation du coach, ou une synthèse des séances.",
  [TYPE_DEMARCHE.AUTRE]: PIECES_AUTRE_DESCRIPTION,
};
