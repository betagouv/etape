/** Les états de la recherche d'employeur. */
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

/** Titre de l'alerte, et annonce, quand aucun établissement ne correspond. */
export const NO_RESULT_TITLE = "Aucun établissement ne correspond à cette recherche";
/** Titre de l'alerte, et annonce, quand la recherche d'entreprises échoue. */
export const SEARCH_ERROR_TITLE = "La recherche d’entreprises ne répond pas pour le moment";
/** Annoncé pendant la relance de la recherche. */
export const RETRYING_ANNOUNCEMENT = "Nouvelle recherche en cours…";

/** Où en est la recherche ; `count` reste indéfini tant qu'aucune réponse n'est arrivée. */
export function findSearchStatus(
  isSearching: boolean,
  hasFailed: boolean,
  isFetching: boolean,
  count?: number,
): SearchStatus {
  if (!isSearching) return SEARCH_STATUS.IDLE;
  if (hasFailed) return isFetching ? SEARCH_STATUS.RETRYING : SEARCH_STATUS.ERROR;
  if (count === undefined) return SEARCH_STATUS.IDLE;
  return count === 0 ? SEARCH_STATUS.NO_RESULT : SEARCH_STATUS.RESULTS;
}

/** Ce qu'annonce la région `role="status"` : rien au repos, sinon le compte des résultats ou le titre de l'alerte affichée. */
export function findSearchAnnouncement(
  status: SearchStatus,
  resultLabel: string,
  moreMessage: string,
): string {
  const announcements: Record<SearchStatus, string> = {
    [SEARCH_STATUS.IDLE]: "",
    [SEARCH_STATUS.RESULTS]: [resultLabel, moreMessage].filter(Boolean).join(" "),
    [SEARCH_STATUS.NO_RESULT]: NO_RESULT_TITLE,
    [SEARCH_STATUS.ERROR]: SEARCH_ERROR_TITLE,
    [SEARCH_STATUS.RETRYING]: RETRYING_ANNOUNCEMENT,
  };
  return announcements[status];
}
