const TELEPHONE_MAX_DIGITS = 10;
// Un numéro français collé ou rempli au format international (`+33 6…`, `0033 6…`, `+33 (0)6…`).
const FRENCH_INTERNATIONAL_PREFIX = /^\s*(\+|00)\s*33\s*(\(0\))?/;
// Saisi au clavier, `+33` passe par `+` et `+3` : sans ce cas, le `+` serait retiré à la première frappe.
const INCOMPLETE_PLUS_PREFIX = /^\s*\+\s*3?\s*$/;

/** Format national à deux chiffres par groupe ; le préfixe `+33` redevient `0`. */
export function formatTelephone(value: string): string {
  if (INCOMPLETE_PLUS_PREFIX.test(value)) return value.replace(/\s/g, "");
  const national = value.replace(FRENCH_INTERNATIONAL_PREFIX, "0");
  const digits = national.replace(/\D/g, "").slice(0, TELEPHONE_MAX_DIGITS);
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ");
}
