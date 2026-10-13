// Mois et année, sans le jour.
//
// Le ticket demande une saisie « au format mois et année » avec le 1er du mois,
// et interdit une date dans le futur. On normalise donc la valeur en
// `YYYY-MM-01` : le jour est fixé UNE fois, ici, plutôt que dans le composant —
// la valeur stockée reste sérialisable, comparable par ordre lexicographique et
// lisible telle quelle.
//
// La saisie se fait chiffre par chiffre : la valeur stockée est la saisie
// BRUTE, mise sous cette même forme (`202-1-01`, `2022-13-01`). Seule une date
// réelle passe `parseMonth` ; une saisie en cours ou impossible reste lisible
// par `readMonthEntry`, et la validation peut dire précisément ce qui ne va pas.
//
// Fichier FEUILLE sans import : partagé par la validation, le champ de saisie
// et le récapitulatif.

/** Année + mois (1 = janvier, 12 = décembre). */
export interface MonthValue {
  year: number;
  month: number;
}

/** Saisie telle que tapée : des chiffres, éventuellement incomplets. */
export interface MonthEntry {
  year: string;
  month: string;
}

export const MOIS_PAR_AN = 12;

/** Longueur d'une saisie complète : 4 chiffres pour l'année, 2 pour le mois. */
export const YEAR_LENGTH = 4;
export const MONTH_LENGTH = 2;

const STORED_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-01$/;
const STORED_SUFFIX = "-01";

/** Sérialise en `YYYY-MM-01`, la forme stockée dans les réponses. */
export function formatMonth({ year, month }: MonthValue): string {
  return `${year}-${String(month).padStart(MONTH_LENGTH, "0")}${STORED_SUFFIX}`;
}

/** Relit une valeur stockée. `null` si elle n'a pas la forme attendue. */
export function parseMonth(value: unknown): MonthValue | null {
  if (typeof value !== "string") return null;
  const match = STORED_PATTERN.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** Saisie brute → valeur stockée. `null` quand les deux parties sont vides. */
export function formatMonthEntry({ year, month }: MonthEntry): string | null {
  if (year === "" && month === "") return null;
  return `${year}-${month}${STORED_SUFFIX}`;
}

/** Valeur stockée → saisie brute, pour la réafficher ou la valider. */
export function readMonthEntry(value: unknown): MonthEntry {
  if (typeof value !== "string" || !value.endsWith(STORED_SUFFIX)) return { year: "", month: "" };
  const [year = "", month = ""] = value.slice(0, -STORED_SUFFIX.length).split("-");
  return { year, month };
}

/** Mois en cours : borne haute de toute saisie (pas de date dans le futur). */
export function currentMonth(): MonthValue {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** Noms des mois, dans l'ordre — index 0 = janvier. */
export const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

/** Libellé lisible d'un mois, pour l'affichage et le récapitulatif. */
export function monthLabel({ year, month }: MonthValue): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Profondeur acceptée : 50 ans, la durée totale d'activité maximale de Q5. Une
 * entrée plus ancienne donnerait une ancienneté que Q5 ne pourrait plus égaler,
 * et le parcours resterait bloqué.
 */
const YEARS_BACK = 50;

/** Année la plus ancienne acceptée à la saisie. */
export function oldestAcceptedYear(): number {
  return currentMonth().year - YEARS_BACK;
}

/**
 * Nombre de mois révolus écoulés depuis `value`. Négatif impossible : un mois
 * futur est déjà refusé par la validation, et vaut 0 par sécurité.
 */
export function monthsSince(value: MonthValue): number {
  const now = currentMonth();
  return Math.max(0, (now.year - value.year) * MOIS_PAR_AN + (now.month - value.month));
}

/** Ce qui empêche une saisie de former une date acceptable. */
export const MONTH_PROBLEM = {
  /** Il manque des chiffres. */
  INCOMPLETE: "incomplete",
  /** Mois à 00 ou au-delà de 12. */
  MONTH_OUT_OF_RANGE: "month-out-of-range",
  YEAR_TOO_OLD: "year-too-old",
  /** Année postérieure à l'année en cours. */
  FUTURE_YEAR: "future-year",
  /** Année en cours, mois pas encore arrivé. */
  FUTURE_MONTH: "future-month",
} as const;

export type MonthProblem = (typeof MONTH_PROBLEM)[keyof typeof MONTH_PROBLEM];

const isComplete = (digits: string, length: number) =>
  digits.length === length && /^\d+$/.test(digits);

/**
 * Premier problème de la saisie, ou `null` si elle forme une date acceptable.
 *
 * Une partie complète est jugée sans attendre l'autre : une année future se
 * signale dès ses quatre chiffres, avant même que le mois soit tapé.
 */
export function monthEntryProblem(entry: MonthEntry, minYear: number): MonthProblem | null {
  const now = currentMonth();
  const hasYear = isComplete(entry.year, YEAR_LENGTH);
  const hasMonth = isComplete(entry.month, MONTH_LENGTH);
  const year = Number(entry.year);
  const month = Number(entry.month);

  if (hasYear && year < minYear) return MONTH_PROBLEM.YEAR_TOO_OLD;
  if (hasYear && year > now.year) return MONTH_PROBLEM.FUTURE_YEAR;
  if (hasMonth && (month < 1 || month > MOIS_PAR_AN)) return MONTH_PROBLEM.MONTH_OUT_OF_RANGE;
  if (!hasYear || !hasMonth) return MONTH_PROBLEM.INCOMPLETE;
  if (year === now.year && month > now.month) return MONTH_PROBLEM.FUTURE_MONTH;
  return null;
}

/** Parties de la saisie à signaler en erreur, selon le problème. */
export interface MonthEntryParts {
  year: boolean;
  month: boolean;
}

export const MONTH_PROBLEM_PARTS: Record<MonthProblem, (entry: MonthEntry) => MonthEntryParts> = {
  [MONTH_PROBLEM.INCOMPLETE]: (entry) => ({
    year: !isComplete(entry.year, YEAR_LENGTH),
    month: !isComplete(entry.month, MONTH_LENGTH),
  }),
  [MONTH_PROBLEM.MONTH_OUT_OF_RANGE]: () => ({ year: false, month: true }),
  [MONTH_PROBLEM.YEAR_TOO_OLD]: () => ({ year: true, month: false }),
  [MONTH_PROBLEM.FUTURE_YEAR]: () => ({ year: true, month: false }),
  [MONTH_PROBLEM.FUTURE_MONTH]: () => ({ year: false, month: true }),
};
