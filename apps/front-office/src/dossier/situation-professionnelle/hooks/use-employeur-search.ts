import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ETABLISSEMENT_SEARCH_MIN_LENGTH,
  searchEtablissements,
  type Etablissement,
  type SearchEtablissementsResponse,
} from "@etape/api-contract";

import { httpClient } from "@/lib/clients";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { useListboxNavigation } from "../../hooks/use-listbox-navigation";
import {
  formatEtablissementCount,
  hasMoreEtablissements,
  MORE_ETABLISSEMENTS_MESSAGE,
} from "../domain/format-etablissement-count";

/** Chaque frappe n'appelle pas Sirene, dont la clé a un quota. */
const SEARCH_DELAY_MS = 300;

/** Le résumé d'erreurs mène à `#employeur`. */
export const EMPLOYEUR_FIELD_ID = "employeur";

export function employeurOptionId({ siret }: Etablissement): string {
  return `${EMPLOYEUR_FIELD_ID}-option-${siret}`;
}

export const SEARCH_STATUS = {
  IDLE: "idle",
  RESULTS: "results",
  NO_RESULT: "no-result",
  ERROR: "error",
  /** « Relancer la recherche » : l'alerte d'erreur reste affichée pendant le nouvel appel. */
  RETRYING: "retrying",
} as const;

export type SearchStatus = (typeof SEARCH_STATUS)[keyof typeof SEARCH_STATUS];

export const NO_RESULT_TITLE = "Aucun établissement ne correspond à cette recherche";
export const SEARCH_ERROR_TITLE = "La recherche d’entreprises ne répond pas pour le moment";
const RETRYING_ANNOUNCEMENT = "Nouvelle recherche en cours…";

export interface EmployeurSearchInputHandlers {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
}

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

function findStatus(
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
  });

  // Pas `isError` : une requête qui n'a jamais abouti repasse en chargement pendant la relance, et l'alerte disparaîtrait avec le focus.
  const hasFailed = query.errorUpdatedAt > query.dataUpdatedAt;
  const count = query.data?.etablissementCount;
  const status = findStatus(isSearching, hasFailed, query.isFetching, count);
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

  const navigation = useListboxNavigation(etablissements, employeurOptionId, select);

  const announcements: Record<SearchStatus, string> = {
    [SEARCH_STATUS.IDLE]: "",
    [SEARCH_STATUS.RESULTS]: [resultLabel, moreMessage].filter(Boolean).join(" "),
    [SEARCH_STATUS.NO_RESULT]: NO_RESULT_TITLE,
    [SEARCH_STATUS.ERROR]: SEARCH_ERROR_TITLE,
    [SEARCH_STATUS.RETRYING]: RETRYING_ANNOUNCEMENT,
  };

  const isPopupOpen =
    isOpen && (status === SEARCH_STATUS.RESULTS || status === SEARCH_STATUS.NO_RESULT);

  return {
    searchText,
    status,
    isPopupOpen,
    resultLabel,
    moreMessage,
    etablissements,
    active: navigation.active,
    announcement: announcements[status],
    inputHandlers: {
      onChange: (event) => {
        setSearchText(event.target.value);
        setOpen(true);
        navigation.reset();
      },
      onKeyDown: (event) => {
        if (event.key === "Escape") {
          setOpen(false);
          navigation.reset();
        } else if (isPopupOpen) {
          // Liste fermée : ni flèche ni Entrée ne désignent une option masquée.
          navigation.onKeyDown(event);
        }
      },
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
