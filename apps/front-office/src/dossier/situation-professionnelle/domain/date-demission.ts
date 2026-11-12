import { startOfDay } from "date-fns";

import { parseFieldDate, type DateFieldCalendar } from "../../domain/field-date";

/** La date de démission la plus récente acceptée. */
export interface DateDemissionBounds {
  /** Démission la plus récente acceptée : le jour même. */
  max: Date;
}

/** Borne commune au schéma et au calendrier, pour qu'il ne propose aucune date refusée. */
export function computeDateDemissionBounds(today: Date): DateDemissionBounds {
  return { max: startOfDay(today) };
}

/** Vrai si la date saisie tombe après le jour même. */
export function isDateDemissionInFuture(value: string, today: Date): boolean {
  const date = parseFieldDate(value);
  return date !== undefined && date > computeDateDemissionBounds(today).max;
}

/** Les jours à venir ne se choisissent pas (maquette 11). */
export function computeDateDemissionCalendar(today: Date): DateFieldCalendar {
  const { max } = computeDateDemissionBounds(today);
  return { defaultMonth: max, endMonth: max, disabled: { after: max } };
}
