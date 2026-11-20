import {
  FORMATS_PIECE_JUSTIFICATIVE_LABEL,
  TAILLE_MAX_PIECE_MO,
} from "../../domain/piece-justificative";

/** Les types de démarche proposés, dans l'ordre de la liste (transmise le 2026-11-18). */
export const TYPE_DEMARCHE = {
  IMMERSION: "immersion",
  RENCONTRE_PROFESSIONNEL: "rencontre-professionnel",
  ENQUETE_METIER: "enquete-metier",
  SALON: "salon",
  PORTES_OUVERTES: "portes-ouvertes",
  ATELIER_INFORMATION: "atelier-information",
  BENEVOLAT: "benevolat",
  RECHERCHES_DOCUMENTAIRES: "recherches-documentaires",
  AUTRE: "autre",
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

/** L'aide du dépôt des justificatifs d'une démarche (maquette 10, formats et taille transmis le 2026-11-18). */
export const PIECES_DEMARCHE_DESCRIPTION = `Attestation, compte-rendu ou tout autre document qui atteste cette démarche. Vous les retrouverez aussi dans «\u00a0Mes documents\u00a0». Formats acceptés : ${FORMATS_PIECE_JUSTIFICATIVE_LABEL}, ${TAILLE_MAX_PIECE_MO} Mo maximum par fichier.`;

/** Nom d'un champ de la démarche en cours de saisie. */
export type DemarcheFieldName = "typeDemarche" | "precisionTypeDemarche" | "apportDemarche";

/** Tous les champs de la démarche en cours de saisie, dans l'ordre de la page. */
export const DEMARCHE_FIELDS: readonly DemarcheFieldName[] = [
  "typeDemarche",
  "precisionTypeDemarche",
  "apportDemarche",
];

const PRECISION_FIELD: DemarcheFieldName = "precisionTypeDemarche";

/** Les champs qu'exige la démarche en cours : la précision n'est demandée que pour « Autre » (maquettes 10 et 11). */
export function findDemarcheFields(
  typeDemarche: TypeDemarche | undefined,
): readonly DemarcheFieldName[] {
  if (typeDemarche === TYPE_DEMARCHE.AUTRE) return DEMARCHE_FIELDS;
  return DEMARCHE_FIELDS.filter((name) => name !== PRECISION_FIELD);
}
