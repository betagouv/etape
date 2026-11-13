import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ETABLISSEMENT_SEARCH_MIN_LENGTH,
  searchEtablissements,
  type Etablissement,
  type SearchEtablissementsResponse,
} from "@etape/api-contract";

import { useListboxNavigation } from "@etape/ui/hooks/use-listbox-navigation";

import { httpClient } from "@/lib/clients";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import {
  findSearchAnnouncement,
  findSearchStatus,
  SEARCH_STATUS,
  type SearchStatus,
} from "../domain/employeur-search";
import {
  formatEtablissementCount,
  hasMoreEtablissements,
  MORE_ETABLISSEMENTS_MESSAGE,
} from "../domain/format-etablissement-count";

/** Chaque frappe n'appelle pas Sirene, dont la clé a un quota. */
const SEARCH_DELAY_MS = 300;

/** Revenir à une recherche déjà faite ne rappelle pas Sirene pendant ce délai. */
const SEARCH_STALE_TIME_MS = 5 * 60 * 1000;

/** Le résumé d'erreurs mène à `#employeur`. */
export const EMPLOYEUR_FIELD_ID = "employeur";

/** L'id de l'option d'un établissement, que désigne l'`aria-activedescendant` du champ. */
export function employeurOptionId({ siret }: Etablissement): string {
  return `${EMPLOYEUR_FIELD_ID}-option-${siret}`;
}

/** Les gestionnaires à poser sur le champ de recherche. */
export interface EmployeurSearchInputHandlers {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
}

/** Ce que renvoie `useEmployeurSearch` : l'état de la recherche et ses actions. */
export interface UseEmployeurSearchResult {
  searchText: string;
  status: SearchStatus;
  /** La liste, ou l'alerte « aucun résultat », sous le champ. */
  isPopupOpen: boolean;
  /** « 20 établissements trouvés sur 45 451 », en tête de liste. */
  resultLabel: string;
  /** Sous la liste quand l'API n'en renvoie qu'une partie, vide sinon. */
  moreMessage: string;
  etablissements: Etablissement[];
  active: Etablissement | null;
  /** Pour la région `role="status"` : vide tant qu'aucune recherche n'a abouti. */
  announcement: string;
  inputHandlers: EmployeurSearchInputHandlers;
  select: (etablissement: Etablissement) => void;
  clear: () => void;
  close: () => void;
  retry: () => void;
}

async function fetchEtablissements(search: string): Promise<SearchEtablissementsResponse> {
  const response = await httpClient.get<unknown>(searchEtablissements.path, {
    params: { search },
  });
  return searchEtablissements.response.parse(response.data);
}

/** Recherche de l'employeur dans Sirene, au fil de la saisie. */
export function useEmployeurSearch(
  onSelect: (etablissement: Etablissement) => void,
): UseEmployeurSearchResult {
  const [searchText, setSearchText] = useState("");
  const [isOpen, setOpen] = useState(false);

  const search = useDebouncedValue(searchText.trim(), SEARCH_DELAY_MS);
  // Le champ fait foi aussitôt qu'il passe sous le minimum : sans cela, l'ancienne recherche réapparaîtrait le temps du délai.
  const isSearching =
    search.length >= ETABLISSEMENT_SEARCH_MIN_LENGTH &&
    searchText.trim().length >= ETABLISSEMENT_SEARCH_MIN_LENGTH;

  const query = useQuery({
    queryKey: ["etablissement", search],
    queryFn: () => fetchEtablissements(search),
    enabled: isSearching,
    // La liste précédente reste affichée pendant l'appel, au lieu de se fermer puis de se rouvrir.
    placeholderData: keepPreviousData,
    // Chaque relance automatique entame le quota de la clé Insee et retarde l'alerte : « Relancer la recherche » suffit.
    retry: false,
    staleTime: SEARCH_STALE_TIME_MS,
  });

  // Pas `isError` : une requête qui n'a jamais abouti repasse en chargement pendant la relance, et l'alerte disparaîtrait avec le focus.
  const hasFailed = query.errorUpdatedAt > query.dataUpdatedAt;
  const count = query.data?.etablissementCount;
  const status = findSearchStatus(isSearching, hasFailed, query.isFetching, count);
  const etablissements = (status === SEARCH_STATUS.RESULTS && query.data?.etablissements) || [];
  const resultLabel =
    query.data === undefined
      ? ""
      : formatEtablissementCount(query.data.etablissements.length, query.data.etablissementCount);
  const moreMessage =
    query.data !== undefined &&
    hasMoreEtablissements(query.data.etablissements.length, query.data.etablissementCount)
      ? MORE_ETABLISSEMENTS_MESSAGE
      : "";

  function select(etablissement: Etablissement): void {
    onSelect(etablissement);
    setSearchText("");
    setOpen(false);
  }

  const isPopupOpen =
    isOpen && (status === SEARCH_STATUS.RESULTS || status === SEARCH_STATUS.NO_RESULT);

  const navigation = useListboxNavigation({
    items: etablissements,
    optionId: employeurOptionId,
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
    etablissements,
    active: navigation.active,
    announcement: findSearchAnnouncement(status, resultLabel, moreMessage),
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
        if (isSuccess) document.getElementById(EMPLOYEUR_FIELD_ID)?.focus();
      });
    },
  };
}
