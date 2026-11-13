import { groupChars } from "../../domain/group-chars";

const SIRET_MAX_DIGITS = 14;
const SIRET_GROUPS: readonly number[] = [3, 3, 3, 5];

/** `50393256800010` → `503 932 568 00010` : SIREN par groupes de trois, puis NIC. */
export function formatSiret(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, SIRET_MAX_DIGITS);
  return groupChars(digits, SIRET_GROUPS);
}
