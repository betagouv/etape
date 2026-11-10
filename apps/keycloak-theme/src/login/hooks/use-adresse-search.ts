import { type ChangeEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";

import { type Adresse, formatAdresse } from "../components/adresse/adresse";
import { findAdresses, MIN_QUERY_LENGTH, toSearchQuery } from "../components/adresse/adresse-api";

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
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState<readonly Adresse[]>([]);
  const [status, setStatus] = useState<AdresseSearchStatus>(ADRESSE_SEARCH_STATUS.IDLE);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE);
  const isFieldFocused = useRef(false);

  useEffect(() => {
    if (query === NO_QUERY) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      findAdresses(query, controller.signal)
        .then((found) => {
          setResults(found);
          setStatus(found.length === 0 ? ADRESSE_SEARCH_STATUS.EMPTY : ADRESSE_SEARCH_STATUS.FOUND);
          setActiveIndex(NO_ACTIVE);
          setIsOpen(found.length !== 0 && isFieldFocused.current);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setResults([]);
          setStatus(ADRESSE_SEARCH_STATUS.UNAVAILABLE);
          setIsOpen(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, attempt]);

  const close = (): void => {
    setIsOpen(false);
    setActiveIndex(NO_ACTIVE);
  };

  const reset = (): void => {
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
    activeIndex,
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
    retry: () => {
      setStatus(ADRESSE_SEARCH_STATUS.SEARCHING);
      setAttempt((current) => current + 1);
    },
    changeText: (event) => {
      const value = event.target.value;
      const nextQuery = toSearchQuery(value);
      setChosen(null);
      setText(value);
      setActiveIndex(NO_ACTIVE);

      if (nextQuery.length < MIN_QUERY_LENGTH) {
        reset();
        return;
      }
      if (nextQuery === query) return;
      setStatus(ADRESSE_SEARCH_STATUS.SEARCHING);
      setQuery(nextQuery);
    },
    handleKeyDown: (event) => {
      const last = results.length - 1;
      switch (event.key) {
        case "ArrowDown":
          if (last < 0) return;
          event.preventDefault();
          setIsOpen(true);
          setActiveIndex(isOpen ? Math.min(activeIndex + 1, last) : 0);
          return;
        case "ArrowUp":
          if (last < 0) return;
          event.preventDefault();
          setIsOpen(true);
          setActiveIndex(isOpen && activeIndex > 0 ? activeIndex - 1 : last);
          return;
        case "Enter": {
          const active = isOpen ? results[activeIndex] : undefined;
          if (active === undefined) return;
          event.preventDefault();
          choose(active);
          return;
        }
        case "Escape":
          if (!isOpen) return;
          event.preventDefault();
          close();
          return;
      }
    },
  };
}
