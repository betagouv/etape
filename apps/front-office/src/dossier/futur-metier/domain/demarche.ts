import { selectPlural, type PluralForms } from "@/lib/plural";
import {
  FORMATS_PIECE_JUSTIFICATIVE_LABEL,
  TAILLE_MAX_PIECE_MO,
  type PieceJustificative,
} from "../../domain/piece-justificative";
import { listFilledFields } from "../../domain/volet-progress";

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

/** Le nombre de démarches qu'un dossier peut porter (décision du 2026-11-20, à revoir). */
export const NOMBRE_MAX_DEMARCHES = 5;

/** Sous le bouton d'ajout, quand le maximum est atteint. */
export const MAX_DEMARCHES_MESSAGE = `Vous pouvez déclarer ${NOMBRE_MAX_DEMARCHES} démarches au maximum.`;

/** La démarche en cours de saisie, telle que le formulaire la porte. */
export interface CurrentDemarche {
  typeDemarche?: TypeDemarche;
  precisionTypeDemarche: string;
  apportDemarche: string;
  piecesJustificatives: PieceJustificative[];
}

/** Une démarche validée. */
export interface Demarche extends CurrentDemarche {
  id: string;
  typeDemarche: TypeDemarche;
}

/** « Démarche 1 » : le titre de la carte, d'après le rang de la démarche dans la liste. */
export function formatDemarcheLabel(index: number): string {
  return `Démarche ${index + 1}`;
}

/** Ce qui nomme une démarche validée : le libellé de son type, ou sa précision pour « Autre » (maquette 12). */
export function findDemarcheIntitule({
  typeDemarche,
  precisionTypeDemarche,
}: Pick<Demarche, "typeDemarche" | "precisionTypeDemarche">): string {
  return typeDemarche === TYPE_DEMARCHE.AUTRE
    ? precisionTypeDemarche
    : TYPE_DEMARCHE_LABEL[typeDemarche];
}

/** Vrai quand tous les champs exigés de la démarche en cours sont remplis : le bouton de validation n'est plus grisé. */
export function isDemarcheFilled(values: Pick<CurrentDemarche, DemarcheFieldName>): boolean {
  const fields = findDemarcheFields(values.typeDemarche);
  return listFilledFields(values, fields).length === fields.length;
}

/**
 * La démarche validée à partir de la saisie en cours ; rien tant qu'aucun type n'est choisi.
 * La précision ne se garde que pour « Autre » : celle d'un type quitté ne suit pas.
 */
export function createDemarche(id: string, current: CurrentDemarche): Demarche | undefined {
  const { typeDemarche, precisionTypeDemarche, apportDemarche, piecesJustificatives } = current;
  if (typeDemarche === undefined) return undefined;
  return {
    id,
    typeDemarche,
    precisionTypeDemarche: typeDemarche === TYPE_DEMARCHE.AUTRE ? precisionTypeDemarche.trim() : "",
    apportDemarche: apportDemarche.trim(),
    piecesJustificatives,
  };
}

/** Vrai tant que le dossier peut recevoir une démarche de plus. */
export function canAddDemarche(demarcheCount: number): boolean {
  return demarcheCount < NOMBRE_MAX_DEMARCHES;
}

/** Pour la région `role="status"` : « Démarche 1 enregistrée. » */
export function formatDemarcheAnnouncement(index: number): string {
  return `${formatDemarcheLabel(index)} enregistrée.`;
}

/** Pour la région `role="status"` : « Saisie de la démarche 2 annulée. » */
export function formatCancelAnnouncement(index: number): string {
  return `Saisie de la démarche ${index + 1} annulée.`;
}

/** Sous le titre d'une démarche validée, quand on veut la modifier alors qu'une autre saisie est ouverte. */
export const EDIT_BLOCKED_MESSAGE =
  "Validez ou annulez la démarche en cours avant de modifier celle-ci.";

/** Le nom accessible du bouton « Modifier » d'une démarche validée : « Modifier la démarche 1 ». */
export function formatEditLabel(index: number): string {
  return `Modifier la démarche ${index + 1}`;
}

/** La liste où la démarche modifiée a pris la place de celle qui porte son `id`. */
export function replaceDemarche(demarches: readonly Demarche[], demarche: Demarche): Demarche[] {
  return demarches.map((current) => (current.id === demarche.id ? demarche : current));
}

/** Pour la région `role="status"` : « Démarche 1 modifiée. » */
export function formatEditAnnouncement(index: number): string {
  return `${formatDemarcheLabel(index)} modifiée.`;
}

/** Pour la région `role="status"` : « Modification de la démarche 1 annulée. » */
export function formatEditCancelAnnouncement(index: number): string {
  return `Modification de la démarche ${index + 1} annulée.`;
}

const REMOVAL_TITLES: PluralForms<string> = {
  one: "Supprimer votre démarche",
  other: "Supprimer vos démarches",
};

/** Ce que la suppression emporte, tel que la fenêtre le dit. */
const REMOVAL_SUBJECTS: PluralForms<string> = {
  one: "la démarche suivante et ses justificatifs",
  other: "les démarches suivantes et leurs justificatifs",
};

const ALL_REMOVED_ANNOUNCEMENTS: PluralForms<string> = {
  one: "Votre démarche a été supprimée.",
  other: "Vos démarches ont été supprimées.",
};

/** Le titre de la fenêtre qui confirme une suppression : une démarche par la corbeille, toutes après un « non » (maquettes 14 et 15). */
export function formatRemovalTitle(demarcheCount: number): string {
  return selectPlural(demarcheCount, REMOVAL_TITLES);
}

/** Sous ce titre : ce que la suppression emporte. */
export function formatRemovalMessage(demarcheCount: number): string {
  return `En cliquant sur «\u00a0Supprimer\u00a0», ${selectPlural(demarcheCount, REMOVAL_SUBJECTS)} seront supprimés de votre dossier, y compris dans «\u00a0Mes documents\u00a0».`;
}

/** Le nom accessible de la corbeille d'une démarche validée : « Supprimer la démarche 1 ». */
export function formatRemoveLabel(index: number): string {
  return `Supprimer la démarche ${index + 1}`;
}

/** La liste sans la démarche qui porte cet `id` : les suivantes remontent d'un rang. */
export function removeDemarche(demarches: readonly Demarche[], demarcheId: string): Demarche[] {
  return demarches.filter(({ id }) => id !== demarcheId);
}

/** Pour la région `role="status"` : « Démarche 1 supprimée. » */
export function formatRemovalAnnouncement(index: number): string {
  return `${formatDemarcheLabel(index)} supprimée.`;
}

/** Pour la région `role="status"`, après un « non » confirmé : toutes les démarches sont supprimées. */
export function formatAllRemovedAnnouncement(demarcheCount: number): string {
  return selectPlural(demarcheCount, ALL_REMOVED_ANNOUNCEMENTS);
}
