import { selectPlural, type PluralForms } from "@/lib/plural";

/** Règles de chaque statut : `docs/conventions/glossaire.md`, « Statut d'un volet » — les modifier ensemble. */
export const STATUT_VOLET = {
  A_REMPLIR: "A_REMPLIR",
  EN_COURS: "EN_COURS",
  A_CORRIGER: "A_CORRIGER",
  COMPLET: "COMPLET",
  FACULTATIF: "FACULTATIF",
} as const;

/** Un statut de volet, parmi ceux de `STATUT_VOLET`. */
export type StatutVolet = (typeof STATUT_VOLET)[keyof typeof STATUT_VOLET];

/** `requiredFieldCount` et `remainingFieldCount` ne comptent que les champs obligatoires ; `filledFieldCount` les compte tous. */
export interface VoletProgress {
  requiredFieldCount: number;
  filledFieldCount: number;
  remainingFieldCount: number;
  errorCount: number;
}

/** Avancement d'une section de volet, affiché par `SectionCounter`. */
export interface SectionProgress {
  remainingFieldCount: number;
  errorCount: number;
}

/** Une ligne du statut, avec le statut dont elle prend le libellé et la couleur. */
export interface StatutVoletLine {
  statut: StatutVolet;
  label: string;
}

/** Libellé des champs restants, au singulier et au pluriel. */
export const REMAINING_FIELD_LABELS: PluralForms<string> = {
  one: "champ restant",
  other: "champs restants",
};

/** Libellé des erreurs à corriger, au singulier et au pluriel. */
export const ERROR_LABELS: PluralForms<string> = {
  one: "erreur à corriger",
  other: "erreurs à corriger",
};

function formatCount(count: number, labels: PluralForms<string>): string {
  return `${count} ${selectPlural(count, labels)}`;
}

/** Ce que compte l'avancement d'un volet : ses champs, ou ses documents pour « Mes documents ». */
export const PROGRESS_UNIT = {
  FIELD: "field",
  DOCUMENT: "document",
} as const;

/** Ce que compte un volet, parmi `PROGRESS_UNIT`. */
export type ProgressUnit = (typeof PROGRESS_UNIT)[keyof typeof PROGRESS_UNIT];

/** Libellé des restants d'une section, au singulier et au pluriel : « 3 champs restants », « 1 document restant ». */
export const REMAINING_LABELS: Record<ProgressUnit, PluralForms<string>> = {
  [PROGRESS_UNIT.FIELD]: REMAINING_FIELD_LABELS,
  [PROGRESS_UNIT.DOCUMENT]: { one: "document restant", other: "documents restants" },
};

const REMAINING_STATUT_LABELS: Record<ProgressUnit, PluralForms<string>> = {
  [PROGRESS_UNIT.FIELD]: REMAINING_FIELD_LABELS,
  [PROGRESS_UNIT.DOCUMENT]: {
    one: "document restant à déposer",
    other: "documents restants à déposer",
  },
};

const A_DEPOSER_LABELS: PluralForms<string> = {
  one: "document à déposer",
  other: "documents à déposer",
};

const A_REMPLIR_LABELS: Record<ProgressUnit, (progress: VoletProgress) => string> = {
  [PROGRESS_UNIT.FIELD]: () => "À remplir",
  [PROGRESS_UNIT.DOCUMENT]: ({ remainingFieldCount }) =>
    formatCount(remainingFieldCount, A_DEPOSER_LABELS),
};

const A_REMPLIR_ANNOUNCEMENTS: Record<ProgressUnit, (progress: VoletProgress) => string> = {
  [PROGRESS_UNIT.FIELD]: () => "à remplir",
  [PROGRESS_UNIT.DOCUMENT]: A_REMPLIR_LABELS[PROGRESS_UNIT.DOCUMENT],
};

type StatutText = (progress: VoletProgress, unit: ProgressUnit) => string;

const STATUT_LABELS: Record<StatutVolet, StatutText> = {
  [STATUT_VOLET.A_REMPLIR]: (progress, unit) => A_REMPLIR_LABELS[unit](progress),
  [STATUT_VOLET.EN_COURS]: ({ remainingFieldCount }, unit) =>
    formatCount(remainingFieldCount, REMAINING_STATUT_LABELS[unit]),
  [STATUT_VOLET.A_CORRIGER]: ({ errorCount }) => formatCount(errorCount, ERROR_LABELS),
  [STATUT_VOLET.COMPLET]: () => "Complet",
  [STATUT_VOLET.FACULTATIF]: () => "Facultatif",
};

// Distinctes des libellés (`accessibilite.md`, § 3) : une phrase reprend les deux lignes du statut.
const STATUT_ANNOUNCEMENTS: Record<StatutVolet, StatutText> = {
  [STATUT_VOLET.A_REMPLIR]: (progress, unit) => A_REMPLIR_ANNOUNCEMENTS[unit](progress),
  [STATUT_VOLET.EN_COURS]: ({ remainingFieldCount }, unit) =>
    formatCount(remainingFieldCount, REMAINING_STATUT_LABELS[unit]),
  [STATUT_VOLET.A_CORRIGER]: ({ errorCount, remainingFieldCount }, unit) =>
    remainingFieldCount > 0
      ? `${formatCount(errorCount, ERROR_LABELS)} et ${formatCount(remainingFieldCount, REMAINING_STATUT_LABELS[unit])}`
      : formatCount(errorCount, ERROR_LABELS),
  [STATUT_VOLET.COMPLET]: () => "complet",
  [STATUT_VOLET.FACULTATIF]: () => "facultatif",
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

/** Les erreurs se cumulent avec les restants, affichés en dessous ; `unit` dit ce qui reste : des champs ou des documents. */
export function listStatutVoletLines(
  progress: VoletProgress,
  unit: ProgressUnit = PROGRESS_UNIT.FIELD,
): StatutVoletLine[] {
  const statut = getStatutVolet(progress);
  const lines = [{ statut, label: STATUT_LABELS[statut](progress, unit) }];

  if (statut === STATUT_VOLET.A_CORRIGER && progress.remainingFieldCount > 0) {
    lines.push({
      statut: STATUT_VOLET.EN_COURS,
      label: STATUT_LABELS[STATUT_VOLET.EN_COURS](progress, unit),
    });
  }

  return lines;
}

/** Annonce du statut, pour la région `role="status"` de l'écran : « Mes informations : complet. » */
export function formatStatutVoletAnnouncement(
  voletLabel: string,
  progress: VoletProgress,
  unit: ProgressUnit = PROGRESS_UNIT.FIELD,
): string {
  return `${voletLabel} : ${STATUT_ANNOUNCEMENTS[getStatutVolet(progress)](progress, unit)}.`;
}
