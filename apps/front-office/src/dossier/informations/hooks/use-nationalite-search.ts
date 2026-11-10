import { useState, type ChangeEvent, type KeyboardEvent } from "react";

import { useListboxNavigation } from "@etape/ui/hooks/use-listbox-navigation";

import { findNationalites, SUGGESTION_NATIONALITE, type Nationalite } from "../domain/nationalites";

interface UseNationaliteSearchOptions {
  idPrefix: string;
  onSelect: (value: string) => void;
}

export interface NationaliteSearchInputHandlers {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export interface UseNationaliteSearchResult {
  searchText: string;
  suggestion: Nationalite | null;
  nationalites: readonly Nationalite[];
  activeValue: string | null;
  optionId: (label: string) => string;
  inputHandlers: NationaliteSearchInputHandlers;
  select: (label: string) => void;
  reset: () => void;
}

export function useNationaliteSearch({
  idPrefix,
  onSelect,
}: UseNationaliteSearchOptions): UseNationaliteSearchResult {
  const [searchText, setSearchText] = useState("");

  const filtered = findNationalites(searchText);

  const suggestionEntry = filtered.find((n) => n.label === SUGGESTION_NATIONALITE);
  const suggestion = suggestionEntry ?? null;
  const nationalites = suggestion
    ? filtered.filter((n) => n.label !== SUGGESTION_NATIONALITE)
    : filtered;

  const allItems = suggestion ? [suggestion, ...nationalites] : [...nationalites];

  const optionId = (label: string): string =>
    `${idPrefix}-option-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const navigation = useListboxNavigation({
    items: allItems,
    optionId: (nationalite) => optionId(nationalite.label),
    onSelect: (nationalite) => select(nationalite.label),
  });

  function select(label: string): void {
    onSelect(label);
    setSearchText("");
    navigation.reset();
  }

  function reset(): void {
    setSearchText("");
    navigation.reset();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setSearchText(event.target.value);
    navigation.reset();
  }

  return {
    searchText,
    suggestion,
    nationalites,
    activeValue: navigation.active?.label ?? null,
    optionId,
    inputHandlers: {
      onChange: handleChange,
      onKeyDown: navigation.onKeyDown,
    },
    select,
    reset,
  };
}
