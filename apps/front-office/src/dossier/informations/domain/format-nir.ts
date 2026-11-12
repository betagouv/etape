import { groupChars } from "../../domain/group-chars";

const NIR_MAX_CHARS = 13;
const NIR_GROUPS: readonly number[] = [1, 2, 2, 2, 3, 3];

/** `1850578006084` → `1 85 05 78 006 084` : chiffres, A et B, treize caractères au plus. */
export function formatNir(value: string): string {
  const chars = value.replace(/[^0-9AaBb]/g, "").slice(0, NIR_MAX_CHARS);
  return groupChars(chars, NIR_GROUPS);
}
