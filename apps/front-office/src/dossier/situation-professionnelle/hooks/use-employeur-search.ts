import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ETABLISSEMENT_SEARCH_MIN_LENGTH,
  searchEtablissements,
  type Etablissement,
  type SearchEtablissementsResponse,
} from "@etape/api-contract";

import { httpClient } from "@/lib/clients";
import { selectPlural, type PluralForms } from "@/lib/plural";
import { useDebouncedValue } from "../../hooks/use-debounced-value";

/** Chaque frappe n'appelle pas Sirene, dont la clé a un quota. */
const SEARCH_DELAY_MS = 300;

const NO_ACTIVE = -1;

const ETABLISSEMENT_FOUND_LABELS: PluralForms<string> = {
  one: "établissement trouvé",
  other: "établissements trouvés",
};

export const NO_ETABLISSEMENT_MESSAGE = "Aucun établissement ne correspond.";
export const SEARCH_ERROR_MESSAGE = "La recherche est indisponible. Réessayez dans un instant.";

/** Le résumé d'erreurs mène à `#employeur`. */
export const EMPLOYEUR_FIELD_ID = "employeur";

export function employeurOptionId({ siret }: Etablissement): string {
  return `${EMPLOYEUR_FIELD_ID}-option-${siret}`;
}

export interface EmployeurSearchInputHandlers {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
}

export interface UseEmployeurSearchResult {
  searchText: string;
  isListOpen: boolean;
  /** En tête de liste, et seul contenu de la liste quand il n'y a aucun établissement. */
  listMessage: string;
  etablissements: Etablissement[];
  active: Etablissement | null;
  /** Pour la région `role="status"` : vide tant qu'aucune recherche n'a abouti. */
  announcement: string;
  inputHandlers: EmployeurSearchInputHandlers;
  select: (etablissement: Etablissement) => void;
  clear: () => void;
}

async function fetchEtablissements(search: string): Promise<SearchEtablissementsResponse> {
  const response = await httpClient.get<unknown>(searchEtablissements.path, {
    params: { search },
  });
  return searchEtablissements.response.parse(response.data);
}

function describeResult(data: SearchEtablissementsResponse): string {
  const { etablissementCount } = data;
  return etablissementCount === 0
    ? NO_ETABLISSEMENT_MESSAGE
    : `${etablissementCount} ${selectPlural(etablissementCount, ETABLISSEMENT_FOUND_LABELS)}`;
}

/** Recherche de l'employeur dans Sirene, au fil de la saisie, et navigation au clavier dans les résultats. */
export function useEmployeurSearch(
  onSelect: (etablissement: Etablissement) => void,
): UseEmployeurSearchResult {
  const [searchText, setSearchText] = useState("");
  const [isOpen, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE);

  const search = useDebouncedValue(searchText.trim(), SEARCH_DELAY_MS);
  const isSearching = search.length >= ETABLISSEMENT_SEARCH_MIN_LENGTH;

  const query = useQuery({
    queryKey: ["etablissement", search],
    queryFn: () => fetchEtablissements(search),
    enabled: isSearching,
  });

  const etablissements = (isSearching && query.data?.etablissements) || [];
  const resultMessage = query.data ? describeResult(query.data) : "";
  const listMessage = query.isError ? SEARCH_ERROR_MESSAGE : resultMessage;
  const active = etablissements[activeIndex] ?? null;

  function select(etablissement: Etablissement): void {
    onSelect(etablissement);
    setSearchText("");
    setOpen(false);
    setActiveIndex(NO_ACTIVE);
  }

  function activate(index: number): void {
    flushSync(() => setActiveIndex(index));
    document
      .getElementById(employeurOptionId(etablissements[index]))
      ?.scrollIntoView({ block: "nearest" });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    const last = etablissements.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (last >= 0) activate(Math.min(activeIndex + 1, last));
        return;
      case "ArrowUp":
        event.preventDefault();
        if (last >= 0) activate(activeIndex > 0 ? activeIndex - 1 : last);
        return;
      case "Enter":
        if (!active) return;
        event.preventDefault();
        select(active);
        return;
      case "Escape":
        setOpen(false);
        return;
    }
  }

  return {
    searchText,
    isListOpen: isOpen && isSearching && listMessage !== "",
    listMessage,
    etablissements,
    active,
    announcement: isSearching ? listMessage : "",
    inputHandlers: {
      onChange: (event) => {
        setSearchText(event.target.value);
        setOpen(true);
        setActiveIndex(NO_ACTIVE);
      },
      onKeyDown: handleKeyDown,
      onFocus: () => setOpen(true),
      onBlur: () => setOpen(false),
    },
    select,
    clear: () => {
      setSearchText("");
      setActiveIndex(NO_ACTIVE);
    },
  };
}
