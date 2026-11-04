import { format, parse } from "date-fns";

const DATE_DEMISSION_FORMAT = "dd/MM/yyyy";
const REFERENCE_DATE = new Date(0);

export function parseDateDemission(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, DATE_DEMISSION_FORMAT, REFERENCE_DATE);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function formatDateDemission(date: Date): string {
  return format(date, DATE_DEMISSION_FORMAT);
}
