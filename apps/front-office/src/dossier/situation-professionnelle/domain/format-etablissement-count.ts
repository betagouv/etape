import { selectPlural, type PluralForms } from "@/lib/plural";

const ETABLISSEMENT_FOUND_LABELS: PluralForms<string> = {
  one: "établissement trouvé",
  other: "établissements trouvés",
};

/** Sous la liste quand l'API n'en renvoie qu'une partie. */
export const MORE_ETABLISSEMENTS_MESSAGE =
  "Précisez votre recherche pour voir les autres établissements.";

export function hasMoreEtablissements(shownCount: number, totalCount: number): boolean {
  return shownCount < totalCount;
}

/** « 20 établissements trouvés sur 45 451 » quand l'API n'en renvoie qu'une partie, sinon « 3 établissements trouvés ». */
export function formatEtablissementCount(shownCount: number, totalCount: number): string {
  const label = `${shownCount} ${selectPlural(shownCount, ETABLISSEMENT_FOUND_LABELS)}`;
  return hasMoreEtablissements(shownCount, totalCount)
    ? `${label} sur ${totalCount.toLocaleString("fr-FR")}`
    : label;
}
