/** Le code ROME tel qu'il s'écrit : sans espace, la lettre en majuscule. */
export function formatCodeRome(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}
