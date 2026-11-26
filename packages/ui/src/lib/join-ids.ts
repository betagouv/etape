/**
 * Les `id` d'un attribut qui en référence plusieurs (`aria-describedby`, `aria-labelledby`),
 * dans l'ordre donné ; `undefined` s'il n'y en a aucun, pour ne pas poser d'attribut vide.
 */
export function joinIds(ids: readonly (string | false | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(" ") || undefined;
}
