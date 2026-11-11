import { startOfDay, subYears } from "date-fns";

import { parseFieldDate, type DateFieldCalendar } from "../../domain/field-date";

export const AGE_MINIMUM = 18;
export const AGE_MAXIMUM = 70;

export interface DateNaissanceBounds {
  /** Naissance la plus ancienne acceptée : `AGE_MAXIMUM` ans révolus le jour même. */
  min: Date;
  /** Naissance la plus récente acceptée : `AGE_MINIMUM` ans révolus le jour même. */
  max: Date;
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

/** Vrai si la date saisie donne au moins `AGE_MINIMUM` ans le jour même. */
export function isAgeMinimumRespected(value: string, today: Date): boolean {
  const date = parseFieldDate(value);
  return date !== undefined && date <= computeDateNaissanceBounds(today).max;
}

/** Vrai si la date saisie donne au plus `AGE_MAXIMUM` ans le jour même. */
export function isAgeMaximumRespected(value: string, today: Date): boolean {
  const date = parseFieldDate(value);
  return date !== undefined && date >= computeDateNaissanceBounds(today).min;
}

/** Le calendrier s'ouvre sur janvier 1990 et se limite aux naissances acceptées. */
export function computeDateNaissanceCalendar(today: Date): DateFieldCalendar {
  const { min, max } = computeDateNaissanceBounds(today);
  return {
    defaultMonth: new Date(1990, 0),
    startMonth: min,
    endMonth: max,
    disabled: { before: min, after: max },
  };
}
