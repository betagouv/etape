import { selectPlural, type PluralForms } from "@/lib/plural";
import { isOui, type OuiNon } from "./oui-non";
import {
  FORMATS_PIECE_JUSTIFICATIVE_LABEL,
  TAILLE_MAX_PIECE_MO,
  type PieceJustificative,
} from "./piece-justificative";
import { listFilledFields } from "./volet-progress";

/** Le type « Autre », dernier de la liste de chaque volet : il se précise en texte libre. */
export const TYPE_DEMARCHE_AUTRE = "autre";

/** Ce qui justifie une démarche « Autre », dans les deux volets (ticket 216). */
export const PIECES_AUTRE_DESCRIPTION =
  "Tout document qui atteste cette démarche : attestation, compte-rendu, synthèse, etc.";

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

/** Libellés des champs de la démarche en cours de saisie, repris par ceux de chaque volet. */
export const DEMARCHE_FIELD_LABEL: Record<DemarcheFieldName | "piecesJustificatives", string> = {
  typeDemarche: "Type de démarche",
  precisionTypeDemarche: "Précisez le type de démarche",
  apportDemarche: "Ce que la démarche vous a apporté",
  piecesJustificatives: "Justificatifs",
};

const PRECISION_FIELD: DemarcheFieldName = "precisionTypeDemarche";

/** Vrai pour le type qui se précise en texte libre : « Autre » (maquettes 10 et 11). */
export function isPrecisionRequired(typeDemarche: string | undefined): boolean {
  return typeDemarche === TYPE_DEMARCHE_AUTRE;
}

/** Les champs qu'exige la démarche en cours : la précision n'est demandée que pour « Autre » (maquettes 10 et 11). */
export function findDemarcheFields(typeDemarche: string | undefined): readonly DemarcheFieldName[] {
  if (isPrecisionRequired(typeDemarche)) return DEMARCHE_FIELDS;
  return DEMARCHE_FIELDS.filter((name) => name !== PRECISION_FIELD);
}

/** Ce qui, avec la réponse à la question du volet, décide des champs de la démarche en cours de saisie. */
export interface OpenDemarche {
  typeDemarche?: string;
  /** Vrai tant que la carte de saisie d'une démarche est ouverte. */
  hasCurrentDemarche: boolean;
}

/**
 * Les champs de la démarche en cours de saisie ne sont demandés qu'après un « oui », et tant que
 * sa carte est ouverte : une démarche validée ne compte plus (maquettes 09, 10 et 12). `answer`
 * est absente tant que la question n'a pas de réponse.
 */
export function findOpenDemarcheFields(
  answer: OuiNon | undefined,
  { typeDemarche, hasCurrentDemarche }: OpenDemarche,
): readonly DemarcheFieldName[] {
  return isOui(answer) && hasCurrentDemarche ? findDemarcheFields(typeDemarche) : [];
}

/** Le nombre de démarches qu'un volet peut porter (décision du 2026-11-20, à revoir). */
export const NOMBRE_MAX_DEMARCHES = 20;

/** Sous le bouton d'ajout, quand le maximum est atteint. */
export const MAX_DEMARCHES_MESSAGE = `Vous pouvez déclarer ${NOMBRE_MAX_DEMARCHES} démarches au maximum.`;

/** La démarche en cours de saisie, telle que le formulaire la porte ; `TType` est un type de la liste du volet. */
export interface CurrentDemarche<TType extends string = string> {
  typeDemarche?: TType;
  precisionTypeDemarche: string;
  apportDemarche: string;
  piecesJustificatives: PieceJustificative[];
}

/** La saisie telle qu'elle s'ouvre pour une nouvelle démarche, et telle qu'elle se referme : sans type, vide. */
export const EMPTY_CURRENT_DEMARCHE: CurrentDemarche<never> = {
  precisionTypeDemarche: "",
  apportDemarche: "",
  piecesJustificatives: [],
};

/** Une démarche validée. */
export interface Demarche<TType extends string = string> extends CurrentDemarche<TType> {
  id: string;
  typeDemarche: TType;
}

/** Ce que le formulaire d'un volet porte pour ses démarches, en plus de la réponse à sa question. */
export interface DemarchesValues<TType extends string = string> extends CurrentDemarche<TType> {
  /** Vrai tant que la carte de saisie est ouverte : elle se referme sur chaque démarche validée. */
  hasCurrentDemarche: boolean;
  /** La démarche validée que la saisie modifie ; `null` pour une nouvelle démarche. */
  currentDemarcheId: string | null;
  demarches: Demarche<TType>[];
}

/** « Démarche 1 » : le titre de la carte, d'après le rang de la démarche dans la liste. */
export function formatDemarcheLabel(index: number): string {
  return `Démarche ${index + 1}`;
}

type DemarcheIntituleFieldName = "typeDemarche" | "precisionTypeDemarche";

/** Ce qui nomme une démarche validée : le libellé de son type, ou sa précision pour « Autre » (maquette 12). */
export function findDemarcheIntitule<TType extends string>(
  { typeDemarche, precisionTypeDemarche }: Pick<Demarche<TType>, DemarcheIntituleFieldName>,
  typeLabels: Record<TType, string>,
): string {
  return isPrecisionRequired(typeDemarche) ? precisionTypeDemarche : typeLabels[typeDemarche];
}

/** Vrai quand tous les champs exigés de la démarche en cours sont remplis : le bouton de validation n'est plus grisé. */
export function isDemarcheFilled(values: Pick<CurrentDemarche, DemarcheFieldName>): boolean {
  const fields = findDemarcheFields(values.typeDemarche);
  return listFilledFields(values, fields).length === fields.length;
}

/** Vrai dès que la saisie en cours porte quelque chose à perdre : un champ rempli ou un justificatif. */
export function isDemarcheStarted(current: CurrentDemarche): boolean {
  return (
    listFilledFields(current, DEMARCHE_FIELDS).length > 0 || current.piecesJustificatives.length > 0
  );
}

/**
 * La démarche validée à partir de la saisie en cours ; rien tant qu'aucun type n'est choisi.
 * La précision ne se garde que pour « Autre » : celle d'un type quitté ne suit pas.
 */
export function createDemarche<TType extends string>(
  id: string,
  current: CurrentDemarche<TType>,
): Demarche<TType> | undefined {
  const { typeDemarche, precisionTypeDemarche, apportDemarche, piecesJustificatives } = current;
  if (typeDemarche === undefined) return undefined;
  return {
    id,
    typeDemarche,
    precisionTypeDemarche: isPrecisionRequired(typeDemarche) ? precisionTypeDemarche.trim() : "",
    apportDemarche: apportDemarche.trim(),
    piecesJustificatives,
  };
}

/** Vrai tant que le volet peut recevoir une démarche de plus. */
export function canAddDemarche(demarcheCount: number): boolean {
  return demarcheCount < NOMBRE_MAX_DEMARCHES;
}

/** Vrai pour une saisie qu'on peut abandonner : dès qu'une démarche est validée. La première ne s'annule pas, on répond « non » (maquettes 10 et 13). */
export function canCancelDemarche(demarcheCount: number): boolean {
  return demarcheCount > 0;
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
export function replaceDemarche<TType extends string>(
  demarches: readonly Demarche<TType>[],
  demarche: Demarche<TType>,
): Demarche<TType>[] {
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

/** À la suite du message, quand un « non » emporte aussi une saisie commencée (absent de la maquette 14, à valider par la PO). */
const CURRENT_DEMARCHE_REMOVAL_MESSAGE =
  "La démarche en cours de saisie et ses justificatifs seront aussi supprimés.";

/** Sous ce titre : ce que la suppression emporte, démarches validées puis saisie commencée. */
export function formatRemovalMessage(
  demarcheCount: number,
  isCurrentDemarcheRemoved: boolean,
): string {
  const message = `En cliquant sur «\u00a0Supprimer\u00a0», ${selectPlural(demarcheCount, REMOVAL_SUBJECTS)} seront supprimés de votre dossier, y compris dans «\u00a0Mes documents\u00a0».`;
  return isCurrentDemarcheRemoved ? `${message} ${CURRENT_DEMARCHE_REMOVAL_MESSAGE}` : message;
}

/** Le nom accessible de la corbeille d'une démarche validée : « Supprimer la démarche 1 ». */
export function formatRemoveLabel(index: number): string {
  return `Supprimer la démarche ${index + 1}`;
}

/** La liste sans la démarche qui porte cet `id` : les suivantes remontent d'un rang. */
export function removeDemarche<TType extends string>(
  demarches: readonly Demarche<TType>[],
  demarcheId: string,
): Demarche<TType>[] {
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
