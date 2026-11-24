import { useEntryMode } from "@etape/ui/hooks/use-entry-mode";

import { ENTRY_MODE, type EntryMode } from "../domain/entry-mode";
import {
  useRemoteSearch,
  type RemoteSearchDefinition,
  type UseRemoteSearchResult,
} from "./use-remote-search";

/** Comment écrire le choix dans le formulaire. */
export interface RemoteSearchItemOptions {
  shouldValidate: boolean;
}

/** Les actions du formulaire dont dépend un champ à recherche. */
export interface RemoteSearchEntryActions<TItem, TName extends string> {
  clearErrors: (names: TName[]) => void;
  setMode: (mode: EntryMode) => void;
  /** Le résultat choisi, ou `null` pour en changer. */
  setItem: (item: TItem | null, options: RemoteSearchItemOptions) => void;
}

/** Ce que renvoie `useRemoteSearchEntry` : la recherche et de quoi passer d'un contenu à l'autre. */
export interface UseRemoteSearchEntryResult<TItem> {
  search: UseRemoteSearchResult<TItem>;
  /** Vrai dès qu'un contenu en a remplacé un autre : celui qui s'affiche prend le focus. */
  isFocusRequested: boolean;
  openManualEntry: () => void;
  openSearch: () => void;
  clearItem: () => void;
}

/**
 * Un champ qui se remplit par une recherche (`RemoteSearchField`), puis affiche le résultat choisi,
 * ou se saisit à la main : le choix, son changement et le passage d'un mode à l'autre.
 * `mode` est la valeur en cours dans le formulaire, `fields` les champs de chaque mode.
 */
export function useRemoteSearchEntry<TItem, TName extends string>(
  definition: RemoteSearchDefinition<TItem>,
  mode: EntryMode,
  fields: Record<EntryMode, readonly TName[]>,
  { clearErrors, setMode, setItem }: RemoteSearchEntryActions<TItem, TName>,
): UseRemoteSearchEntryResult<TItem> {
  const { isFocusRequested, requestFocus, switchMode } = useEntryMode(mode, fields, {
    clearErrors,
    setMode,
  });

  const search = useRemoteSearch(definition, (item) => {
    setItem(item, { shouldValidate: true });
    requestFocus();
  });

  return {
    search,
    isFocusRequested,
    openManualEntry: () => switchMode(ENTRY_MODE.MANUAL),
    openSearch: () => {
      // On repart d'une recherche vide : l'ancienne rouvrirait son alerte « aucun résultat ».
      search.clear();
      switchMode(ENTRY_MODE.SEARCH);
    },
    clearItem: () => {
      // Pas de contrôle : l'erreur « champ vide » s'afficherait avant toute nouvelle recherche.
      setItem(null, { shouldValidate: false });
      requestFocus();
    },
  };
}
