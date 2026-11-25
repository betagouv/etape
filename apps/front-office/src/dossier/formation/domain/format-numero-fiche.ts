/** Le code RNCP tel qu'il s'écrit : sans espace, en majuscules (« RNCP12345 »). */
export function formatNumeroFiche(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}
