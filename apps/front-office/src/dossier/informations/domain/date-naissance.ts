import { startOfDay, subYears } from "date-fns";

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
