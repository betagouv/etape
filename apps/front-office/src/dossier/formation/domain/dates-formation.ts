import { addDays, addYears, startOfDay } from "date-fns";

import { parseFieldDate, type DateFieldCalendar } from "../../domain/field-date";

/** Jusqu'où la date de début se choisit, en années à partir d'aujourd'hui. */
export const HORIZON_DATE_DEBUT_FORMATION_ANNEES = 3;

/**
 * Jusqu'où la date de fin se choisit : trois ans de plus que le début, pour qu'une formation qui
 * commence tard puisse encore durer.
 */
export const HORIZON_DATE_FIN_FORMATION_ANNEES = 6;

/** Les dates de formation la plus proche et les plus lointaines acceptées. */
export interface DatesFormationBounds {
  /** Aujourd'hui : une formation déjà commencée n'est pas acceptée (décision du 2026-11-25). */
  min: Date;
  /** Dernière date de début : dans `HORIZON_DATE_DEBUT_FORMATION_ANNEES` ans, jour pour jour. */
  maxDebut: Date;
  /** Dernière date de fin : dans `HORIZON_DATE_FIN_FORMATION_ANNEES` ans, jour pour jour. */
  maxFin: Date;
}

/** Bornes communes au schéma et au calendrier, pour qu'il ne propose aucune date refusée. */
export function computeDatesFormationBounds(today: Date): DatesFormationBounds {
  const min = startOfDay(today);
  return {
    min,
    maxDebut: addYears(min, HORIZON_DATE_DEBUT_FORMATION_ANNEES),
    maxFin: addYears(min, HORIZON_DATE_FIN_FORMATION_ANNEES),
  };
}

/** Vrai si la date saisie tombe avant aujourd'hui. */
export function isDateFormationInPast(value: string, today: Date): boolean {
  const date = parseFieldDate(value);
  return date !== undefined && date < computeDatesFormationBounds(today).min;
}

/** Vrai si la date de début saisie tombe au-delà de son horizon. */
export function isDateDebutFormationAfterHorizon(value: string, today: Date): boolean {
  const date = parseFieldDate(value);
  return date !== undefined && date > computeDatesFormationBounds(today).maxDebut;
}

/** Vrai si la date de fin saisie tombe au-delà de son horizon. */
export function isDateFinFormationAfterHorizon(value: string, today: Date): boolean {
  const date = parseFieldDate(value);
  return date !== undefined && date > computeDatesFormationBounds(today).maxFin;
}

/** Vrai si les deux dates sont choisies et que la fin ne tombe pas après le début. */
export function isDateFinBeforeDebut(dateFin: string, dateDebut: string): boolean {
  const fin = parseFieldDate(dateFin);
  const debut = parseFieldDate(dateDebut);
  return fin !== undefined && debut !== undefined && fin <= debut;
}

/** Le calendrier de la date de début : d'aujourd'hui à son horizon. */
export function computeDateDebutFormationCalendar(today: Date): DateFieldCalendar {
  const { min, maxDebut } = computeDatesFormationBounds(today);
  return {
    defaultMonth: min,
    startMonth: min,
    endMonth: maxDebut,
    disabled: { before: min, after: maxDebut },
  };
}

/**
 * Le calendrier de la date de fin : à partir du lendemain de la date de début quand elle est
 * choisie, d'aujourd'hui sinon, jusqu'à son horizon.
 */
export function computeDateFinFormationCalendar(today: Date, dateDebut: string): DateFieldCalendar {
  const { min, maxFin } = computeDatesFormationBounds(today);
  const debut = parseFieldDate(dateDebut);
  const first = debut !== undefined && debut >= min ? addDays(debut, 1) : min;
  return {
    defaultMonth: first,
    startMonth: first,
    endMonth: maxFin,
    disabled: { before: first, after: maxFin },
  };
}
