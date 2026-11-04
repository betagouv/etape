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
  return {
    min: new Date(today.getFullYear() - AGE_MAXIMUM, today.getMonth(), today.getDate()),
    max: new Date(today.getFullYear() - AGE_MINIMUM, today.getMonth(), today.getDate()),
  };
}
