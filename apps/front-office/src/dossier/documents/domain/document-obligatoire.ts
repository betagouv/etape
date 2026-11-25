import type { FieldErrors } from "../../domain/field-error-announcement";
import { formatStatutVoletChange, PROGRESS_UNIT } from "../../domain/statut-volet";
import { VOLET_ID } from "../../domain/volet-id";
import {
  buildRequiredFields,
  computeVoletProgress,
  type RequiredFields,
} from "../../domain/volet-progress";
import { findVoletLabel } from "../../domain/volets-dossier";
import {
  DOCUMENTS_FIELD,
  DOCUMENTS_SECTION,
  type DocumentsFieldName,
  type DocumentsSection,
} from "../schema";

/** Un document obligatoire de « Mes documents » : son champ et ses textes. */
export interface DocumentObligatoire {
  field: DocumentsFieldName;
  title: string;
  description: string;
  dropLabel: string;
}

/** Les documents obligatoires, dans l'ordre de la page (maquette « Mes documents », écran 01). */
export const DOCUMENTS_OBLIGATOIRES: readonly DocumentObligatoire[] = [
  {
    field: DOCUMENTS_FIELD.PROGRAMME_FORMATION,
    title: "Programme de la formation",
    description: "Le programme détaillé remis par l’organisme de formation.",
    dropLabel: "Relâchez pour ajouter vos fichiers au programme de la formation.",
  },
  {
    field: DOCUMENTS_FIELD.CALENDRIER_FORMATION,
    title: "Calendrier de la formation",
    description: "Les dates de début et de fin, et le rythme de la formation.",
    dropLabel: "Relâchez pour ajouter vos fichiers au calendrier de la formation.",
  },
  {
    field: DOCUMENTS_FIELD.DEVIS_FORMATION,
    title: "Devis de la formation",
    description:
      "Le document de l’organisme qui indique les frais pédagogiques et, s’il y en a, les frais d’inscription.",
    dropLabel: "Relâchez pour ajouter vos fichiers au devis de la formation.",
  },
];

/** Les pièces de chaque document, telles que le formulaire les porte. */
export type DocumentsPieces = Partial<Record<DocumentsFieldName, readonly unknown[]>>;

const SECTION_FIELDS: Record<DocumentsSection, readonly DocumentsFieldName[]> = {
  [DOCUMENTS_SECTION.OBLIGATOIRES]: DOCUMENTS_OBLIGATOIRES.map(({ field }) => field),
};

/** Les documents demandés, et ceux qui ont au moins une pièce : un document compte dès sa première pièce. */
export function findDocumentsRequiredFields(
  pieces: DocumentsPieces,
): RequiredFields<DocumentsSection, DocumentsFieldName> {
  return buildRequiredFields(pieces, SECTION_FIELDS);
}

/** Le statut du volet tel qu'il s'annonce après un dépôt ou un retrait ; vide s'il n'a pas changé. */
export function formatDocumentsStatutChange(
  before: DocumentsPieces,
  after: DocumentsPieces,
  errors: FieldErrors,
): string {
  return formatStatutVoletChange(
    findVoletLabel(VOLET_ID.DOCUMENTS),
    computeVoletProgress(findDocumentsRequiredFields(before), errors),
    computeVoletProgress(findDocumentsRequiredFields(after), errors),
    PROGRESS_UNIT.DOCUMENT,
  );
}
