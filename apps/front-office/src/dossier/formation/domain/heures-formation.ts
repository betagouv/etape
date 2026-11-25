/**
 * Le plus d'heures de formation accepté par semaine : la durée maximale légale du travail sur
 * une semaine, pour arrêter une faute de frappe (« 350 » pour « 35 »).
 */
export const HEURES_PAR_SEMAINE_MAX = 48;

const HEURES_PATTERN = /^\d+$/;

/** Le nombre d'heures saisi, `undefined` s'il n'est pas un nombre entier (« 35,5 », « 35 h »). */
export function parseHeures(value: string): number | undefined {
  const trimmed = value.trim();
  return HEURES_PATTERN.test(trimmed) ? Number(trimmed) : undefined;
}
