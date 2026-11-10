import { format, parse } from "date-fns";

/** Le format des dates saisies dans les volets, comme sur les maquettes. */
const FIELD_DATE_FORMAT = "dd/MM/yyyy";
const REFERENCE_DATE = new Date(0);

/** La date saisie au format jj/mm/aaaa, `undefined` si elle est vide ou invalide. */
export function parseFieldDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, FIELD_DATE_FORMAT, REFERENCE_DATE);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/** La date au format jj/mm/aaaa des champs. */
export function formatFieldDate(date: Date): string {
  return format(date, FIELD_DATE_FORMAT);
}
