import type { SecteurActivite } from "@etape/api-contract";
import { normalizeForSearch } from "@etape/utils/text";

import { selectPlural, type PluralForms } from "@/lib/plural";

/** Message de la liste vide quand la recherche ne retient aucun secteur. */
export const NO_SECTEUR_MESSAGE = "Aucun secteur d’activité ne correspond.";
/** Message de la liste vide quand les secteurs n'ont pas pu être chargés. */
export const SECTEURS_ERROR_MESSAGE = "La liste des secteurs d’activité est indisponible.";
/** Message de la liste vide pendant le chargement des secteurs. */
export const SECTEURS_LOADING_MESSAGE = "Chargement des secteurs d’activité…";

const SECTEUR_FOUND_LABELS: PluralForms<string> = {
  one: "secteur d’activité trouvé",
  other: "secteurs d’activité trouvés",
};

/** Sans casse, accents, points ni espaces : `10.71C`, `1071c` et `10 71C` se valent. */
function normalizeCode(text: string): string {
  return normalizeForSearch(text).replace(/[.\s]/g, "");
}

/** Le code APE (ou NAF) tel qu'il figure sur le bulletin de salaire, ou un mot-clé du libellé. */
export function findSecteursActivite(
  secteurs: readonly SecteurActivite[],
  search: string,
): SecteurActivite[] {
  const words = search.split(/\s+/).map(normalizeCode).filter(Boolean);
  if (words.length === 0) return [];

  const code = normalizeCode(search);
  return secteurs.filter(
    (secteur) =>
      normalizeCode(secteur.code).startsWith(code) ||
      words.every((word) => normalizeCode(secteur.libelle).includes(word)),
  );
}

/** Le secteur dont le code est exactement celui saisi (`1071C`, `10.71c`), sinon `undefined`. */
export function findSecteurActiviteByCode(
  secteurs: readonly SecteurActivite[],
  search: string,
): SecteurActivite | undefined {
  const code = normalizeCode(search);
  return code === "" ? undefined : secteurs.find((secteur) => normalizeCode(secteur.code) === code);
}

/** `Boulangerie et boulangerie-pâtisserie (10.71C)`, comme dans la maquette. */
export function formatSecteurActivite({ code, libelle }: SecteurActivite): string {
  return `${libelle} (${code})`;
}

/** Ce que devient le champ quand on le quitte. */
export const SECTEUR_BLUR_OUTCOME = {
  /** Un code complet tapé sans passer par la liste désigne déjà son secteur. */
  SELECT: "select",
  /** Le champ a été vidé : le bénéficiaire retire son secteur. */
  CLEAR: "clear",
  /** Un secteur est choisi et le texte ne désigne rien d'autre : le champ le réaffiche. */
  RESTORE: "restore",
  /** Aucun secteur choisi : le texte tapé reste, la recherche pourra reprendre. */
  KEEP_TEXT: "keep-text",
} as const;

/** L'issue retenue à la sortie du champ, avec le secteur quand elle en désigne un. */
export type SecteurBlurOutcome =
  | { outcome: typeof SECTEUR_BLUR_OUTCOME.SELECT; secteur: SecteurActivite }
  | { outcome: typeof SECTEUR_BLUR_OUTCOME.CLEAR }
  | { outcome: typeof SECTEUR_BLUR_OUTCOME.RESTORE }
  | { outcome: typeof SECTEUR_BLUR_OUTCOME.KEEP_TEXT };

/** Ce que devient le champ quand il perd le focus ; `searchText` à `null` : aucune saisie en cours. */
export function findSecteurBlurOutcome(
  secteurs: readonly SecteurActivite[],
  searchText: string | null,
  hasSelection: boolean,
): SecteurBlurOutcome {
  if (searchText === null) return { outcome: SECTEUR_BLUR_OUTCOME.RESTORE };
  if (searchText.trim() === "") return { outcome: SECTEUR_BLUR_OUTCOME.CLEAR };
  const secteur = findSecteurActiviteByCode(secteurs, searchText);
  if (secteur) return { outcome: SECTEUR_BLUR_OUTCOME.SELECT, secteur };
  return { outcome: hasSelection ? SECTEUR_BLUR_OUTCOME.RESTORE : SECTEUR_BLUR_OUTCOME.KEEP_TEXT };
}

/** Ce que dit la liste quand elle n'a aucune option : chargement, liste indisponible, ou aucun secteur trouvé. */
export function findSecteurEmptyMessage(isPending: boolean, isError: boolean): string {
  if (isPending) return SECTEURS_LOADING_MESSAGE;
  return isError ? SECTEURS_ERROR_MESSAGE : NO_SECTEUR_MESSAGE;
}

/** Ce qu'annonce la région `role="status"` : rien tant que la liste est fermée, sinon ce que la liste affiche. */
export function findSecteurAnnouncement(
  isListOpen: boolean,
  secteurCount: number,
  emptyMessage: string,
  moreMessage: string,
): string {
  if (!isListOpen) return "";
  if (secteurCount === 0) return emptyMessage;
  return moreMessage || `${secteurCount} ${selectPlural(secteurCount, SECTEUR_FOUND_LABELS)}`;
}
