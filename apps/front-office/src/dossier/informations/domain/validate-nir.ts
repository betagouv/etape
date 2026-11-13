/**
 * S AA MM DD CCC NNN
 * S : sexe (1 ou 2)
 * AA : année de naissance
 * MM : mois (01-12, 20+ cas spéciaux)
 * DD : département (01-95, 2A, 2B, 97-99)
 * CCC : commune INSEE
 * NNN : numéro d'ordre
 */
export const NIR_PATTERN = /^[12] \d{2} (0[1-9]|[1-9]\d) (0[1-9]|[1-9]\d|2[AaBb]) \d{3} \d{3}$/;

function stripSpaces(value: string): string {
  return value.replace(/\s/g, "");
}

function nirToNumber(nir: string): number {
  const upper = stripSpaces(nir).toUpperCase();
  if (upper.includes("2A")) return Number(upper.replace("2A", "19"));
  if (upper.includes("2B")) return Number(upper.replace("2B", "18"));
  return Number(upper);
}

/** La clé attendue pour ce NIR : 97 moins le reste de sa division par 97. */
export function computeCleNir(nir: string): number {
  return 97 - (nirToNumber(nir) % 97);
}

/** Vrai si la clé saisie est celle du NIR. */
export function isCleNirValid(nir: string, cle: string): boolean {
  return computeCleNir(nir) === Number(cle);
}
