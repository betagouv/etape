import {
  formatStatutVoletAnnouncement,
  PROGRESS_UNIT,
  type SectionProgress,
  type VoletProgress,
} from "../../domain/statut-volet";
import { VOLET_ID } from "../../domain/volet-id";
import { findVoletLabel } from "../../domain/volets-dossier";
import { DOCUMENTS_FIELD, type DocumentsFieldName } from "../schema";

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

/** Avancement du volet en documents : un document obligatoire est rempli dès sa première pièce. */
export function computeDocumentsProgress(pieces: DocumentsPieces): VoletProgress {
  const filledCount = DOCUMENTS_OBLIGATOIRES.filter(
    ({ field }) => (pieces[field]?.length ?? 0) > 0,
  ).length;
  return {
    requiredFieldCount: DOCUMENTS_OBLIGATOIRES.length,
    filledFieldCount: filledCount,
    remainingFieldCount: DOCUMENTS_OBLIGATOIRES.length - filledCount,
    errorCount: 0,
  };
}

/** Le statut du volet tel qu'il s'annonce après un dépôt ou un retrait ; vide s'il n'a pas changé. */
export function formatDocumentsStatutChange(
  before: DocumentsPieces,
  after: DocumentsPieces,
): string {
  const voletLabel = findVoletLabel(VOLET_ID.DOCUMENTS);
  const previous = formatStatutVoletAnnouncement(
    voletLabel,
    computeDocumentsProgress(before),
    PROGRESS_UNIT.DOCUMENT,
  );
  const next = formatStatutVoletAnnouncement(
    voletLabel,
    computeDocumentsProgress(after),
    PROGRESS_UNIT.DOCUMENT,
  );
  return next === previous ? "" : next;
}

/** Le compteur de « Documents obligatoires » : les documents sans pièce. */
export function computeDocumentsObligatoiresProgress({
  remainingFieldCount,
  errorCount,
}: VoletProgress): SectionProgress {
  return { remainingFieldCount, errorCount };
}
