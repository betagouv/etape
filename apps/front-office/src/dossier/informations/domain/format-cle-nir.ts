const CLE_NIR_MAX_DIGITS = 2;

/** La clé de sécurité sociale : deux chiffres, rien d'autre. */
export function formatCleNir(value: string): string {
  return value.replace(/\D/g, "").slice(0, CLE_NIR_MAX_DIGITS);
}
