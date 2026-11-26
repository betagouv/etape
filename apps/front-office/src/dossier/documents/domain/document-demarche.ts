import { findDemarcheIntitule, type Demarche } from "../../domain/demarche";
import { isOui, type OuiNon } from "../../domain/oui-non";
import { VOLET_ID } from "../../domain/volet-id";

/** Les volets dont les démarches ont leurs justificatifs dans « Mes documents ». */
export type DemarchesVoletId = typeof VOLET_ID.FUTUR_METIER | typeof VOLET_ID.PROJET;

/** Ce que « Mes documents » montre des démarches d'un volet (maquettes « Mes documents », écrans 01 et 16). */
export const DEMARCHES_DISPLAY = {
  HIDDEN: "hidden",
  EMPTY: "empty",
  DOCUMENTS: "documents",
} as const;

/** Un affichage, parmi ceux de `DEMARCHES_DISPLAY`. */
export type DemarchesDisplay = (typeof DEMARCHES_DISPLAY)[keyof typeof DEMARCHES_DISPLAY];

/** Rien sans « oui » à la question du volet ; le texte vide tant qu'aucune démarche n'est validée ; sinon leurs documents. */
export function findDemarchesDisplay(
  answer: OuiNon | undefined,
  demarcheCount: number,
): DemarchesDisplay {
  if (!isOui(answer)) return DEMARCHES_DISPLAY.HIDDEN;
  return demarcheCount > 0 ? DEMARCHES_DISPLAY.DOCUMENTS : DEMARCHES_DISPLAY.EMPTY;
}

/** Le sous-titre des démarches de chaque volet. */
export const DEMARCHES_VOLET_TITLE: Record<DemarchesVoletId, string> = {
  [VOLET_ID.FUTUR_METIER]: "Les démarches en lien avec votre futur métier",
  [VOLET_ID.PROJET]: "Les démarches en lien avec votre projet",
};

/** Ce qui nomme et décrit les démarches d'un volet : le libellé de chaque type, et ce qui le justifie. */
export interface DemarchesTexts<TType extends string> {
  typeLabels: Record<TType, string>;
  pieceDescriptions: Record<TType, string>;
}

/** Les justificatifs d'une démarche validée, tels que « Mes documents » les montre. */
export interface DocumentDemarche {
  demarche: Demarche;
  /** Le titre de sa carte dans le volet : le libellé du type, ou la précision pour « Autre ». */
  title: string;
  description: string;
}

/** Un document par démarche validée, dans l'ordre du volet. */
export function listDocumentsDemarches<TType extends string>(
  demarches: readonly Demarche<TType>[],
  { typeLabels, pieceDescriptions }: DemarchesTexts<TType>,
): DocumentDemarche[] {
  return demarches.map((demarche) => ({
    demarche,
    title: findDemarcheIntitule(demarche, typeLabels),
    description: pieceDescriptions[demarche.typeDemarche],
  }));
}

/** Le texte vide, après un « oui » sans démarche validée (maquette « Mes documents », écran 16). */
export const EMPTY_DEMARCHES_TEXT =
  "Vous avez indiqué avoir entrepris des démarches, mais aucune n’est encore renseignée.";

/** La suite du texte vide, qui nomme le volet où valider une démarche. */
export function formatEmptyDemarchesHint(voletLabel: string): string {
  return `Dès qu’une démarche est validée dans la section «\u00a0${voletLabel}\u00a0», elle apparaît ici et vous pouvez y ajouter vos justificatifs.`;
}
