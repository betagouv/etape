import type { SecteurActivite } from "@etape/api-contract";

/** Sans casse, accents, points ni espaces : `10.71C`, `1071c` et `10 71C` se valent. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ.\s]/g, "")
    .toLowerCase();
}

/** Le code APE (ou NAF) tel qu'il figure sur le bulletin de salaire, ou un mot-clé du libellé. */
export function findSecteursActivite(
  secteurs: readonly SecteurActivite[],
  search: string,
): SecteurActivite[] {
  const words = search.split(/\s+/).map(normalize).filter(Boolean);
  if (words.length === 0) return [];

  const code = normalize(search);
  return secteurs.filter(
    (secteur) =>
      normalize(secteur.code).startsWith(code) ||
      words.every((word) => normalize(secteur.libelle).includes(word)),
  );
}

/** `Boulangerie et boulangerie-pâtisserie (10.71C)`, comme dans la maquette. */
export function formatSecteurActivite({ code, libelle }: SecteurActivite): string {
  return `${libelle} (${code})`;
}
