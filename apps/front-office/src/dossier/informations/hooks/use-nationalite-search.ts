import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";

import { findNationalites, SUGGESTION_NATIONALITE, type Nationalite } from "../nationalites";

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

const NO_ACTIVE = -1;

export function useNationaliteSearch({
  idPrefix,
  onSelect,
}: UseNationaliteSearchOptions): UseNationaliteSearchResult {
  const [searchText, setSearchText] = useState("");
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE);

  const filtered = findNationalites(searchText);

  const suggestionEntry = filtered.find((n) => n.label === SUGGESTION_NATIONALITE);
  const suggestion = suggestionEntry ?? null;
  const nationalites = suggestion
    ? filtered.filter((n) => n.label !== SUGGESTION_NATIONALITE)
    : filtered;

  const allItems = suggestion ? [suggestion, ...nationalites] : [...nationalites];

  const active = activeIndex >= 0 && activeIndex < allItems.length ? activeIndex : NO_ACTIVE;
  const activeValue = active !== NO_ACTIVE ? allItems[active].label : null;

  const optionId = (label: string): string =>
    `${idPrefix}-option-${label.toLowerCase().replace(/\s+/g, "-")}`;

  function select(label: string): void {
    onSelect(label);
    setSearchText("");
    setActiveIndex(NO_ACTIVE);
  }

  function reset(): void {
    setSearchText("");
    setActiveIndex(NO_ACTIVE);
  }

  function activate(index: number): void {
    flushSync(() => {
      setActiveIndex(index);
    });
    const item = allItems[index];
    if (item) {
      document.getElementById(optionId(item.label))?.scrollIntoView({ block: "nearest" });
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setSearchText(event.target.value);
    setActiveIndex(NO_ACTIVE);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    const last = allItems.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (last >= 0) activate(Math.min(active + 1, last));
        return;
      case "ArrowUp":
        event.preventDefault();
        if (last >= 0) activate(active > 0 ? active - 1 : last);
        return;
      case "Enter":
        if (activeValue === null) return;
        event.preventDefault();
        select(activeValue);
        return;
    }
  }

  return {
    searchText,
    suggestion,
    nationalites,
    activeValue,
    optionId,
    inputHandlers: {
      onChange: handleChange,
      onKeyDown: handleKeyDown,
    },
    select,
    reset,
  };
}
