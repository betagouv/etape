// Mois et année, sans le jour.
//
// Le ticket demande une saisie « au format mois et année » avec le 1er du mois,
// et interdit une date dans le futur. On normalise donc la valeur en
// `YYYY-MM-01` : le jour est fixé UNE fois, ici, plutôt que dans le composant —
// la valeur stockée reste sérialisable, comparable par ordre lexicographique et
// lisible telle quelle.
//
// Fichier FEUILLE sans import : partagé par la validation, le champ de saisie
// et le récapitulatif.

/** Année + mois (1 = janvier, 12 = décembre). */
export interface MonthValue {
  year: number;
  month: number;
}

const STORED_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-01$/;

/** Sérialise en `YYYY-MM-01`, la forme stockée dans les réponses. */
export function formatMonth({ year, month }: MonthValue): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/** Relit une valeur stockée. `null` si elle n'a pas la forme attendue. */
export function parseMonth(value: unknown): MonthValue | null {
  if (typeof value !== "string") return null;
  const match = STORED_PATTERN.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** Mois en cours : borne haute de toute saisie (pas de date dans le futur). */
export function currentMonth(): MonthValue {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** `a` est-il postérieur à `b` ? */
export function isMonthAfter(a: MonthValue, b: MonthValue): boolean {
  return a.year !== b.year ? a.year > b.year : a.month > b.month;
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

/** Profondeur du sélecteur d'année : au-delà, la saisie n'a plus de sens. */
const YEARS_BACK = 60;

/** Année la plus ancienne proposée à la saisie — bornée par la validation. */
export function oldestSelectableYear(): number {
  return currentMonth().year - YEARS_BACK;
}

/**
 * Nombre de mois révolus écoulés depuis `value`. Négatif impossible : un mois
 * futur est déjà refusé par la validation, et vaut 0 par sécurité.
 */
export function monthsSince(value: MonthValue): number {
  const now = currentMonth();
  return Math.max(0, (now.year - value.year) * 12 + (now.month - value.month));
}
