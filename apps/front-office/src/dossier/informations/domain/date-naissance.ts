import { format, parse, startOfDay, subYears } from "date-fns";

export const AGE_MINIMUM = 18;
export const AGE_MAXIMUM = 70;

const DATE_NAISSANCE_FORMAT = "dd/MM/yyyy";
const REFERENCE_DATE = new Date(0);

export interface DateNaissanceBounds {
  /** Naissance la plus ancienne acceptée : `AGE_MAXIMUM` ans révolus le jour même. */
  min: Date;
  /** Naissance la plus récente acceptée : `AGE_MINIMUM` ans révolus le jour même. */
  max: Date;
}

export function parseDateNaissance(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, DATE_NAISSANCE_FORMAT, REFERENCE_DATE);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function formatDateNaissance(date: Date): string {
  return format(date, DATE_NAISSANCE_FORMAT);
}

/** Bornes communes au schéma et au calendrier, pour qu'il ne propose aucune date refusée. */
export function computeDateNaissanceBounds(today: Date): DateNaissanceBounds {
  // `subYears` ramène un 29 février au 28 : `new Date(année, 1, 29)` déborderait au 1er mars.
  const day = startOfDay(today);
  return {
    min: subYears(day, AGE_MAXIMUM),
    max: subYears(day, AGE_MINIMUM),
  };
}
