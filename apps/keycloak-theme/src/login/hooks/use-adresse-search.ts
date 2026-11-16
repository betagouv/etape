import { useListboxNavigation } from "@etape/ui/hooks/use-listbox-navigation";
import { KEY } from "@etape/ui/lib/keys";
import { type ChangeEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";

import { type Adresse, formatAdresse } from "../components/adresse/adresse";
import { findAdresses, MIN_QUERY_LENGTH, toSearchQuery } from "../components/adresse/adresse-api";
import { createDebouncedRequest } from "./debounced-request";

/** États de la recherche d'adresse. */
export const ADRESSE_SEARCH_STATUS = {
  IDLE: "idle",
  SEARCHING: "searching",
  FOUND: "found",
  EMPTY: "empty",
  UNAVAILABLE: "unavailable",
} as const;

/** État de la recherche d'adresse. */
export type AdresseSearchStatus =
  (typeof ADRESSE_SEARCH_STATUS)[keyof typeof ADRESSE_SEARCH_STATUS];

const DEBOUNCE_MS = 250;
const NO_ACTIVE = -1;
const NO_QUERY = "";
/** Liste des suggestions, cible d'`aria-controls`. */
export const ADRESSE_SUGGESTIONS_ID = "adresse-suggestions";

/** Identifiant d'une suggestion dans la page, pour `aria-activedescendant`. */
export function adresseOptionId(index: number): string {
  return `${ADRESSE_SUGGESTIONS_ID}-${index}`;
}

/** État de la recherche d'adresse et ses gestionnaires d'événements. */
export interface UseAdresseSearchResult {
  text: string;
  chosen: Adresse | null;
  results: readonly Adresse[];
  status: AdresseSearchStatus;
  isOpen: boolean;
  activeIndex: number;
  choose: (adresse: Adresse) => void;
  clear: () => void;
  retry: () => void;
  handleFocus: () => void;
  handleBlur: () => void;
  changeText: (event: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

/** Recherche d'adresse avec suggestions, annulée à chaque nouvelle saisie. */
export function useAdresseSearch(initial: Adresse | null): UseAdresseSearchResult {
  const [text, setText] = useState(initial === null ? "" : formatAdresse(initial));
  const [chosen, setChosen] = useState(initial);
  const [query, setQuery] = useState(NO_QUERY);
  const [results, setResults] = useState<readonly Adresse[]>([]);
  const [status, setStatus] = useState<AdresseSearchStatus>(ADRESSE_SEARCH_STATUS.IDLE);
  const [isOpen, setIsOpen] = useState(false);
  const isFieldFocused = useRef(false);
  const [request] = useState(createDebouncedRequest);

  useEffect(() => request.cancel, [request]);

  const search = (nextQuery: string): void => {
    setStatus(ADRESSE_SEARCH_STATUS.SEARCHING);
    request.run((signal) => {
      findAdresses(nextQuery, signal)
        .then((found) => {
          if (signal.aborted) return;
          setResults(found);
          setStatus(found.length === 0 ? ADRESSE_SEARCH_STATUS.EMPTY : ADRESSE_SEARCH_STATUS.FOUND);
          navigation.reset();
          setIsOpen(found.length !== 0 && isFieldFocused.current);
        })
        .catch(() => {
          if (signal.aborted) return;
          setResults([]);
          setStatus(ADRESSE_SEARCH_STATUS.UNAVAILABLE);
          setIsOpen(false);
        });
    }, DEBOUNCE_MS);
  };

  const navigation = useListboxNavigation({
    items: results,
    optionId: (adresse) => adresseOptionId(results.indexOf(adresse)),
    isOpen: results.length !== 0,
    onSelect: (adresse) => choose(adresse),
    onEscape: () => close(),
  });

  const close = (): void => {
    setIsOpen(false);
    navigation.reset();
  };

  const reset = (): void => {
    request.cancel();
    setQuery(NO_QUERY);
    setResults([]);
    setStatus(ADRESSE_SEARCH_STATUS.IDLE);
    close();
  };

  const choose = (adresse: Adresse): void => {
    setChosen(adresse);
    setText(formatAdresse(adresse));
    reset();
  };

  return {
    text,
    chosen,
    results,
    status,
    isOpen,
    activeIndex: navigation.active === null ? NO_ACTIVE : results.indexOf(navigation.active),
    choose,
    handleFocus: () => {
      isFieldFocused.current = true;
    },
    handleBlur: () => {
      isFieldFocused.current = false;
      close();
    },
    clear: () => {
      setChosen(null);
      setText("");
      reset();
    },
    retry: () => search(query),
    changeText: (event) => {
      const value = event.target.value;
      const nextQuery = toSearchQuery(value);
      setChosen(null);
      setText(value);
      navigation.reset();

      if (nextQuery.length < MIN_QUERY_LENGTH) {
        reset();
        return;
      }
      if (nextQuery === query) return;
      setQuery(nextQuery);
      search(nextQuery);
    },
    handleKeyDown: (event) => {
      const isArrow = event.key === KEY.ARROW_DOWN || event.key === KEY.ARROW_UP;
      if (isArrow && results.length !== 0) setIsOpen(true);
      navigation.onKeyDown(event);
    },
  };
}
