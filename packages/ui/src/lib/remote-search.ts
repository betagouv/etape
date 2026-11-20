import type { ChangeEvent, KeyboardEvent } from "react";

/** Les états d'une recherche au fil de la saisie. */
export const SEARCH_STATUS = {
  IDLE: "idle",
  RESULTS: "results",
  NO_RESULT: "no-result",
  ERROR: "error",
  /** « Relancer la recherche » : l'alerte d'erreur reste affichée pendant le nouvel appel. */
  RETRYING: "retrying",
} as const;

/** Un état de la recherche, parmi ceux de `SEARCH_STATUS`. */
export type SearchStatus = (typeof SEARCH_STATUS)[keyof typeof SEARCH_STATUS];

/** Les gestionnaires à poser sur le champ de recherche. */
export interface RemoteSearchInputHandlers {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
}

/** L'état d'une recherche et ses actions, tels que `RemoteSearchField` les affiche. */
export interface RemoteSearchState<TItem> {
  searchText: string;
  status: SearchStatus;
  /** La liste, ou l'alerte « aucun résultat », sous le champ. */
  isPopupOpen: boolean;
  /** « 20 établissements trouvés sur 45 451 », en tête de liste. */
  resultLabel: string;
  /** Sous la liste quand l'API n'en renvoie qu'une partie, vide sinon. */
  moreMessage: string;
  items: TItem[];
  /** Le résultat désigné au clavier. */
  active: TItem | null;
  /** Pour la région `role="status"` : vide tant qu'aucune recherche n'a abouti. */
  announcement: string;
  inputHandlers: RemoteSearchInputHandlers;
  select: (item: TItem) => void;
  clear: () => void;
  close: () => void;
  retry: () => void;
}

/** Les textes de `RemoteSearchField` propres à ce qu'on recherche. */
export interface RemoteSearchFieldTexts {
  /** L'aide sous le champ. */
  description: string;
  /** Le nom accessible de la liste de résultats. */
  listLabel: string;
  noResultTitle: string;
  noResultDescription: string;
  errorTitle: string;
  errorDescription: string;
  /** Le bouton des deux alertes, qui remplace la recherche par une saisie à la main. */
  manualEntryLabel: string;
}

/** Ce qui distingue un champ de recherche d'un autre. */
export interface RemoteSearchFieldDefinition<TItem> {
  /** L'`id` du champ, où mène le résumé d'erreurs de l'écran. */
  id: string;
  label: string;
  maxLength: number;
  /** L'id de l'option d'un résultat, que désigne l'`aria-activedescendant` du champ. */
  optionId: (item: TItem) => string;
  texts: RemoteSearchFieldTexts;
}
