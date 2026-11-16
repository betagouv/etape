import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useListboxNavigation } from "@etape/ui/hooks/use-listbox-navigation";
import {
  SEARCH_STATUS,
  type RemoteSearchFieldDefinition,
  type RemoteSearchState,
} from "@etape/ui/lib/remote-search";

import { formatResultCount, hasMoreResults } from "../domain/format-result-count";
import {
  findSearchAnnouncement,
  findSearchStatus,
  type RemoteSearchTexts,
} from "../domain/remote-search";
import { useDebouncedValue } from "./use-debounced-value";

/** Chaque frappe n'appelle pas l'API : la recherche d'entreprises entame le quota de la clé Insee. */
const SEARCH_DELAY_MS = 300;

/** Revenir à une recherche déjà faite ne rappelle pas l'API pendant ce délai. */
const SEARCH_STALE_TIME_MS = 5 * 60 * 1000;

/** Ce que l'API renvoie pour une recherche : une partie des résultats, et leur nombre total. */
export interface RemoteSearchResults<TItem> {
  items: TItem[];
  totalCount: number;
}

/** Une recherche, décrite une fois pour son champ (`RemoteSearchField`) et pour ses appels. */
export interface RemoteSearchDefinition<TItem> extends RemoteSearchFieldDefinition<TItem> {
  /** Début de la clé de cache, que suit le texte recherché. */
  queryKey: string;
  minLength: number;
  fetchResults: (search: string) => Promise<RemoteSearchResults<TItem>>;
  texts: RemoteSearchTexts;
}

/** Ce que renvoie `useRemoteSearch` : l'état de la recherche et ses actions, pour `RemoteSearchField`. */
export type UseRemoteSearchResult<TItem> = RemoteSearchState<TItem>;

/**
 * Recherche auprès de l'API au fil de la saisie : liste de résultats, clavier, alertes et relance.
 * `definition` se définit hors du rendu.
 */
export function useRemoteSearch<TItem>(
  { id, queryKey, minLength, fetchResults, optionId, texts }: RemoteSearchDefinition<TItem>,
  onSelect: (item: TItem) => void,
): UseRemoteSearchResult<TItem> {
  const [searchText, setSearchText] = useState("");
  const [isOpen, setOpen] = useState(false);

  const search = useDebouncedValue(searchText.trim(), SEARCH_DELAY_MS);
  // Le champ fait foi aussitôt qu'il passe sous le minimum : sans cela, l'ancienne recherche réapparaîtrait le temps du délai.
  const isSearching = search.length >= minLength && searchText.trim().length >= minLength;

  const query = useQuery({
    queryKey: [queryKey, search],
    queryFn: () => fetchResults(search),
    enabled: isSearching,
    // La liste précédente reste affichée pendant l'appel, au lieu de se fermer puis de se rouvrir.
    placeholderData: keepPreviousData,
    // Chaque relance automatique entame le quota de la clé Insee et retarde l'alerte : « Relancer la recherche » suffit.
    retry: false,
    staleTime: SEARCH_STALE_TIME_MS,
  });

  // Pas `isError` : une requête qui n'a jamais abouti repasse en chargement pendant la relance, et l'alerte disparaîtrait avec le focus.
  const hasFailed = query.errorUpdatedAt > query.dataUpdatedAt;
  const status = findSearchStatus(isSearching, hasFailed, query.isFetching, query.data?.totalCount);
  const items = (status === SEARCH_STATUS.RESULTS && query.data?.items) || [];
  const resultLabel =
    query.data === undefined
      ? ""
      : formatResultCount(query.data.items.length, query.data.totalCount, texts.foundLabels);
  const moreMessage =
    query.data !== undefined && hasMoreResults(query.data.items.length, query.data.totalCount)
      ? texts.moreMessage
      : "";

  function select(item: TItem): void {
    onSelect(item);
    setSearchText("");
    setOpen(false);
  }

  const isPopupOpen =
    isOpen && (status === SEARCH_STATUS.RESULTS || status === SEARCH_STATUS.NO_RESULT);

  const navigation = useListboxNavigation({
    items,
    optionId,
    isOpen: isPopupOpen,
    onSelect: select,
    onEscape: () => setOpen(false),
  });

  return {
    searchText,
    status,
    isPopupOpen,
    resultLabel,
    moreMessage,
    items,
    active: navigation.active,
    announcement: findSearchAnnouncement(status, resultLabel, moreMessage, texts),
    inputHandlers: {
      onChange: (event) => {
        setSearchText(event.target.value);
        setOpen(true);
        navigation.reset();
      },
      onKeyDown: navigation.onKeyDown,
      onFocus: () => setOpen(true),
    },
    select,
    clear: () => {
      setSearchText("");
      navigation.reset();
    },
    close: () => setOpen(false),
    retry: () => {
      if (status === SEARCH_STATUS.RETRYING) return;
      // `cancelRefetch: false` : un second clic avant le rendu ne relance pas l'appel en cours.
      void query.refetch({ cancelRefetch: false }).then(({ isSuccess }) => {
        // L'alerte disparaît avec le bouton qui a le focus : il revient au champ, qui rouvre la liste.
        if (isSuccess) document.getElementById(id)?.focus();
      });
    },
  };
}
