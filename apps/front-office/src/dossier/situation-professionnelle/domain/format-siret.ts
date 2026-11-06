/** `50393256800010` → `503 932 568 00010` : SIREN par groupes de trois, puis NIC. */
export function formatSiret(siret: string): string {
  return siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4");
}
