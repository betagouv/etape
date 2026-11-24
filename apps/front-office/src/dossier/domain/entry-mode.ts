/** Un champ à recherche se remplit en choisissant un résultat, ou à la main quand la recherche échoue. */
export const ENTRY_MODE = {
  SEARCH: "search",
  MANUAL: "manual",
} as const;

/** Un mode de saisie, parmi ceux d'`ENTRY_MODE`. */
export type EntryMode = (typeof ENTRY_MODE)[keyof typeof ENTRY_MODE];
