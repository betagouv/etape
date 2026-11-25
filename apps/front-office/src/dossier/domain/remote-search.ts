import {
  SEARCH_STATUS,
  type RemoteSearchFieldTexts,
  type SearchStatus,
} from "@etape/ui/lib/remote-search";

import { joinAnnouncements } from "@/lib/join-announcements";
import type { PluralForms } from "@/lib/plural";

/** Annoncé pendant la relance de la recherche. */
export const RETRYING_ANNOUNCEMENT = "Nouvelle recherche en cours…";

/** Titres des deux alertes d'une recherche, aussi annoncés. */
export type SearchAlertTitles = Pick<RemoteSearchFieldTexts, "noResultTitle" | "errorTitle">;

/** Les textes propres à ce qu'on recherche : ceux du champ, et ceux du compte des résultats. */
export interface RemoteSearchTexts extends RemoteSearchFieldTexts {
  /** Sous la liste quand l'API n'en renvoie qu'une partie. */
  moreMessage: string;
  /** « établissement trouvé », « établissements trouvés ». */
  foundLabels: PluralForms<string>;
}

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
  titles: SearchAlertTitles,
): string {
  const announcements: Record<SearchStatus, string> = {
    [SEARCH_STATUS.IDLE]: "",
    [SEARCH_STATUS.RESULTS]: joinAnnouncements(resultLabel, moreMessage),
    [SEARCH_STATUS.NO_RESULT]: titles.noResultTitle,
    [SEARCH_STATUS.ERROR]: titles.errorTitle,
    [SEARCH_STATUS.RETRYING]: RETRYING_ANNOUNCEMENT,
  };
  return announcements[status];
}
