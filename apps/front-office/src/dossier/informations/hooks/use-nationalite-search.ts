import { useState, type ChangeEvent, type KeyboardEvent } from "react";

import { useListboxNavigation } from "@etape/ui/hooks/use-listbox-navigation";

import { useDebouncedValue } from "../../hooks/use-debounced-value";
import {
  findNationaliteAnnouncement,
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

/** La liste se filtre à chaque frappe : on n'annonce que le nombre où la saisie s'arrête. */
const ANNOUNCEMENT_DELAY_MS = 300;

/** Les gestionnaires à poser sur le champ de recherche. */
export interface NationaliteSearchInputHandlers {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

/** Ce que renvoie `useNationaliteSearch` : l'état de la recherche et ses actions. */
export interface UseNationaliteSearchResult {
  searchText: string;
  isListOpen: boolean;
  /** La nationalité choisie, pour le drapeau et le texte du champ. */
  selected: Nationalite | undefined;
  /** La nationalité proposée en tête de liste, quand la recherche la retient. */
  suggestion: Nationalite | null;
  nationalites: readonly Nationalite[];
  /** Pour la région `role="status"` : vide tant que la liste est fermée ou que rien n'est recherché. */
  announcement: string;
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
  const options = suggestion ? [suggestion, ...nationalites] : nationalites;

  const navigation = useListboxNavigation({
    items: options,
    optionId: nationaliteOptionId,
    isOpen: isListOpen,
    onSelect: (nationalite) => select(nationalite),
  });
  const announcement = useDebouncedValue(
    findNationaliteAnnouncement(isListOpen, searchText, options.length),
    ANNOUNCEMENT_DELAY_MS,
  );

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
    announcement,
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
