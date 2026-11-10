import { useState, type ChangeEvent, type KeyboardEvent } from "react";

import { useListboxNavigation } from "@etape/ui/hooks/use-listbox-navigation";

import {
  findNationaliteByCode,
  findNationalites,
  splitSuggestion,
  type Nationalite,
} from "../domain/nationalites";

/** Le résumé d'erreurs mène à `#nationalite`. */
export const NATIONALITE_FIELD_ID = "nationalite";

/** L'id de l'option d'une nationalité, que désigne l'`aria-activedescendant` de la recherche. */
export function nationaliteOptionId({ code }: Nationalite): string {
  return `${NATIONALITE_FIELD_ID}-option-${code}`;
}

export interface NationaliteSearchInputHandlers {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export interface UseNationaliteSearchResult {
  searchText: string;
  isListOpen: boolean;
  /** La nationalité choisie, pour le drapeau et le texte du champ. */
  selected: Nationalite | undefined;
  /** La nationalité proposée en tête de liste, quand la recherche la retient. */
  suggestion: Nationalite | null;
  nationalites: readonly Nationalite[];
  active: Nationalite | null;
  inputHandlers: NationaliteSearchInputHandlers;
  select: (nationalite: Nationalite) => void;
  /** Ouvre ou ferme la liste ; à la fermeture, la recherche repart de zéro. */
  setListOpen: (isOpen: boolean) => void;
}

/** Choix d'une nationalité dans une liste que filtre la recherche. La valeur est le code. */
export function useNationaliteSearch(
  code: string,
  onChange: (code: string) => void,
): UseNationaliteSearchResult {
  const [searchText, setSearchText] = useState("");
  const [isListOpen, setOpen] = useState(false);

  const { suggestion, nationalites } = splitSuggestion(findNationalites(searchText));

  const navigation = useListboxNavigation({
    items: suggestion ? [suggestion, ...nationalites] : nationalites,
    optionId: nationaliteOptionId,
    isOpen: isListOpen,
    onSelect: (nationalite) => select(nationalite),
  });

  function setListOpen(isOpen: boolean): void {
    setOpen(isOpen);
    if (isOpen) return;
    setSearchText("");
    navigation.reset();
  }

  function select(nationalite: Nationalite): void {
    onChange(nationalite.code);
    setListOpen(false);
  }

  return {
    searchText,
    isListOpen,
    selected: findNationaliteByCode(code),
    suggestion,
    nationalites,
    active: navigation.active,
    inputHandlers: {
      onChange: (event) => {
        setSearchText(event.target.value);
        navigation.reset();
      },
      onKeyDown: navigation.onKeyDown,
    },
    select,
    setListOpen,
  };
}
