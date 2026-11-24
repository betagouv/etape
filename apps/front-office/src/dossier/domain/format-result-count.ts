import { selectPlural, type PluralForms } from "@/lib/plural";

/** Vrai quand la recherche compte plus de résultats que la liste n'en affiche. */
export function hasMoreResults(shownCount: number, totalCount: number): boolean {
  return shownCount < totalCount;
}

/** « 20 établissements trouvés sur 45 451 » quand l'API n'en renvoie qu'une partie, sinon « 3 établissements trouvés ». */
export function formatResultCount(
  shownCount: number,
  totalCount: number,
  foundLabels: PluralForms<string>,
): string {
  const label = `${shownCount} ${selectPlural(shownCount, foundLabels)}`;
  return hasMoreResults(shownCount, totalCount)
    ? `${label} sur ${totalCount.toLocaleString("fr-FR")}`
    : label;
}
