/**
 * S AA MM DD CCC NNN
 * S : sexe (1 ou 2)
 * AA : année de naissance
 * MM : mois (01-12, 20+ cas spéciaux)
 * DD : département (01-95, 2A, 2B, 97-99)
 * CCC : commune INSEE
 * NNN : numéro d'ordre
 */
export const NIR_PATTERN = /^[12]\d{2}(0[1-9]|[1-9]\d)(0[1-9]|[1-9]\d|2[AaBb])\d{6}$/;

function nirToNumber(nir: string): number {
  const upper = nir.toUpperCase();
  if (upper.includes("2A")) return Number(upper.replace("2A", "19"));
  if (upper.includes("2B")) return Number(upper.replace("2B", "18"));
  return Number(upper);
}

export function computeCleNir(nir: string): number {
  return 97 - (nirToNumber(nir) % 97);
}

export function isCleNirValid(nir: string, cle: string): boolean {
  return computeCleNir(nir) === Number(cle);
}
