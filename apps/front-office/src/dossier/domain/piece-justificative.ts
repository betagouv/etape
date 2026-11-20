import { selectPlural, type PluralForms } from "@/lib/plural";
import { formatFieldDate } from "./field-date";

/** Une pièce justificative déposée : son fichier reste dans le navigateur tant que le dossier n'est pas envoyé. */
export interface PieceJustificative {
  id: string;
  fichier: File;
  dateDepot: Date;
}

/** Les formats acceptés, tels qu'ils s'affichent (liste transmise le 2026-11-18). */
export const FORMATS_PIECE_JUSTIFICATIVE = [
  "PDF",
  "JPG",
  "JPEG",
  "PNG",
  "DOCX",
  "XLSX",
  "CSV",
] as const;

/** « PDF, JPG, JPEG, PNG, DOCX, XLSX, CSV », pour les textes d'aide et d'erreur. */
export const FORMATS_PIECE_JUSTIFICATIVE_LABEL = FORMATS_PIECE_JUSTIFICATIVE.join(", ");

/** L'attribut `accept` du sélecteur de fichiers : « .pdf,.jpg… ». */
export const ACCEPT_PIECE_JUSTIFICATIVE = FORMATS_PIECE_JUSTIFICATIVE.map(
  (format) => `.${format.toLowerCase()}`,
).join(",");

/** Taille maximale d'un fichier (transmise le 2026-11-18). */
export const TAILLE_MAX_PIECE_MO = 10;

const BYTES_PER_KB = 1_000;
const BYTES_PER_MB = 1_000_000;

const EXTENSION_SEPARATOR = ".";
const DETAILS_SEPARATOR = " · ";

const SIZE_FORMAT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/** Le format d'un fichier d'après son extension, en majuscules : « PDF » ; vide s'il n'en a pas. */
export function findFormatFichier(name: string): string {
  const separatorIndex = name.lastIndexOf(EXTENSION_SEPARATOR);
  // Un nom qui commence par un point (« .pdf ») n'a pas d'extension.
  if (separatorIndex <= 0) return "";
  return name.slice(separatorIndex + 1).toUpperCase();
}

/** La taille telle qu'elle s'affiche : « 1,2 Mo », ou en Ko en dessous de 1 Mo. */
export function formatSize(octets: number): string {
  if (octets >= BYTES_PER_MB) return `${SIZE_FORMAT.format(octets / BYTES_PER_MB)} Mo`;
  // Arrondi au Ko supérieur : un fichier non vide ne s'affiche pas « 0 Ko ».
  return `${Math.ceil(octets / BYTES_PER_KB)} Ko`;
}

/** Sous le nom d'une pièce déposée : « PDF · 1,2 Mo · Déposé le 24/09/2026 ». */
export function formatPieceDetails({ fichier, dateDepot }: PieceJustificative): string {
  return [
    findFormatFichier(fichier.name),
    formatSize(fichier.size),
    `Déposé le ${formatFieldDate(dateDepot)}`,
  ].join(DETAILS_SEPARATOR);
}

/** Pourquoi un fichier est refusé. */
export const REJECTION_REASON = {
  FORMAT: "format",
  SIZE: "size",
} as const;

/** Un motif de refus, parmi ceux de `REJECTION_REASON`. */
export type RejectionReason = (typeof REJECTION_REASON)[keyof typeof REJECTION_REASON];

/** Un fichier refusé, et le message qui l'explique. */
export interface RejectedFichier {
  name: string;
  reason: RejectionReason;
  message: string;
}

/** Les fichiers gardés et les fichiers refusés d'un ajout. */
export interface CheckedFichiers {
  accepted: File[];
  rejected: RejectedFichier[];
}

/** Le message d'un refus, repris du kit (`upload-file`). */
function formatRejectionMessage(reason: RejectionReason, fichier: File): string {
  const messages: Record<RejectionReason, string> = {
    [REJECTION_REASON.FORMAT]: `Ce format n’est pas accepté. Formats acceptés : ${FORMATS_PIECE_JUSTIFICATIVE_LABEL}.`,
    [REJECTION_REASON.SIZE]: `Ce fichier fait ${formatSize(fichier.size)}, au-delà de la taille maximale de ${TAILLE_MAX_PIECE_MO} Mo. Réduisez sa taille, ou déposez le document en plusieurs fichiers.`,
  };
  return messages[reason];
}

/** Le motif qui fait refuser un fichier ; rien s'il est accepté. */
function findRejectionReason(fichier: File): RejectionReason | undefined {
  const formats: readonly string[] = FORMATS_PIECE_JUSTIFICATIVE;
  if (!formats.includes(findFormatFichier(fichier.name))) return REJECTION_REASON.FORMAT;
  if (fichier.size > TAILLE_MAX_PIECE_MO * BYTES_PER_MB) return REJECTION_REASON.SIZE;
  return undefined;
}

/** Contrôle des fichiers ajoutés, dans l'ordre : format, puis taille du fichier. */
export function checkFichiers(fichiers: readonly File[]): CheckedFichiers {
  const checked: CheckedFichiers = { accepted: [], rejected: [] };
  for (const fichier of fichiers) {
    const reason = findRejectionReason(fichier);
    if (reason === undefined) {
      checked.accepted.push(fichier);
    } else {
      checked.rejected.push({
        name: fichier.name,
        reason,
        message: formatRejectionMessage(reason, fichier),
      });
    }
  }
  return checked;
}

const ADDED_FICHIER_LABELS: PluralForms<string> = {
  one: "fichier ajouté",
  other: "fichiers ajoutés",
};

const ANNOUNCEMENT_SEPARATOR = " ";

/**
 * Ce qui s'annonce après un ajout : le fichier gardé, ou leur nombre, puis chaque fichier refusé
 * avec sa raison. Vide si l'ajout ne contenait aucun fichier.
 */
export function formatAddAnnouncement({ accepted, rejected }: CheckedFichiers): string {
  const [first] = accepted;
  const parts: string[] = [];
  if (accepted.length === 1 && first) parts.push(`${first.name} ajouté.`);
  if (accepted.length > 1)
    parts.push(`${accepted.length} ${selectPlural(accepted.length, ADDED_FICHIER_LABELS)}.`);
  for (const { name, message } of rejected) parts.push(`${name} refusé : ${message}`);
  return parts.join(ANNOUNCEMENT_SEPARATOR);
}

/** Ce qui s'annonce quand une pièce est retirée. */
export function formatRemoveAnnouncement(name: string): string {
  return `${name} retiré.`;
}
