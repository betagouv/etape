import { selectPlural, type PluralForms } from "@/lib/plural";
import type { StatutVoletLine, VoletProgress } from "./types";

export const STATUT_VOLET = {
  A_REMPLIR: "A_REMPLIR",
  EN_COURS: "EN_COURS",
  A_CORRIGER: "A_CORRIGER",
  COMPLET: "COMPLET",
  FACULTATIF: "FACULTATIF",
} as const;

export type StatutVolet = (typeof STATUT_VOLET)[keyof typeof STATUT_VOLET];

const REMAINING_FIELD_LABELS: PluralForms<string> = {
  one: "champ restant",
  other: "champs restants",
};

const ERROR_LABELS: PluralForms<string> = {
  one: "erreur à corriger",
  other: "erreurs à corriger",
};

function formatCount(count: number, labels: PluralForms<string>): string {
  return `${count} ${selectPlural(count, labels)}`;
}

const STATUT_LABELS: Record<StatutVolet, (progress: VoletProgress) => string> = {
  [STATUT_VOLET.A_REMPLIR]: () => "À remplir",
  [STATUT_VOLET.EN_COURS]: ({ remainingFieldCount }) =>
    formatCount(remainingFieldCount, REMAINING_FIELD_LABELS),
  [STATUT_VOLET.A_CORRIGER]: ({ errorCount }) => formatCount(errorCount, ERROR_LABELS),
  [STATUT_VOLET.COMPLET]: () => "Complet",
  [STATUT_VOLET.FACULTATIF]: () => "Facultatif",
};

// Un volet sans champ obligatoire ne bloque pas la soumission du dossier.
const IS_COMPLETED_BY_STATUT: Record<StatutVolet, boolean> = {
  [STATUT_VOLET.A_REMPLIR]: false,
  [STATUT_VOLET.EN_COURS]: false,
  [STATUT_VOLET.A_CORRIGER]: false,
  [STATUT_VOLET.COMPLET]: true,
  [STATUT_VOLET.FACULTATIF]: true,
};

/** Une erreur l'emporte sur le reste : un volet n'est complet, ou facultatif, que sans erreur. */
export function getStatutVolet({
  requiredFieldCount,
  filledFieldCount,
  remainingFieldCount,
  errorCount,
}: VoletProgress): StatutVolet {
  if (errorCount > 0) return STATUT_VOLET.A_CORRIGER;
  if (requiredFieldCount === 0) return STATUT_VOLET.FACULTATIF;
  if (filledFieldCount === 0) return STATUT_VOLET.A_REMPLIR;
  if (remainingFieldCount > 0) return STATUT_VOLET.EN_COURS;
  return STATUT_VOLET.COMPLET;
}

/** Compté dans les sections complétées de l'en-tête du dossier. */
export function isVoletCompleted(progress: VoletProgress): boolean {
  return IS_COMPLETED_BY_STATUT[getStatutVolet(progress)];
}

/** Les erreurs se cumulent avec les champs restants, affichés en dessous. */
export function listStatutVoletLines(progress: VoletProgress): StatutVoletLine[] {
  const statut = getStatutVolet(progress);
  const lines = [{ statut, label: STATUT_LABELS[statut](progress) }];

  if (statut === STATUT_VOLET.A_CORRIGER && progress.remainingFieldCount > 0) {
    lines.push({
      statut: STATUT_VOLET.EN_COURS,
      label: STATUT_LABELS[STATUT_VOLET.EN_COURS](progress),
    });
  }

  return lines;
}
