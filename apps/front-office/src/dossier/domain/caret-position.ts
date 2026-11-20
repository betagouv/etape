/**
 * Position du curseur dans `formatted`, la saisie `raw` une fois mise en forme : juste après
 * autant de caractères utiles (`isSignificant`) qu'il y en avait avant `caret` dans `raw`.
 */
export function findCaretAfterFormat(
  raw: string,
  caret: number,
  formatted: string,
  isSignificant: (char: string) => boolean,
): number {
  const significantCount = [...raw.slice(0, caret)].filter(isSignificant).length;
  if (significantCount === 0) return 0;

  let count = 0;
  for (let index = 0; index < formatted.length; index++) {
    if (isSignificant(formatted.charAt(index))) count++;
    if (count === significantCount) return index + 1;
  }
  // Des caractères utiles ont été retirés (saisie tronquée) : le curseur va en fin de champ.
  return formatted.length;
}
