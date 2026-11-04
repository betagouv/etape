import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSecteursActivite, type SecteurActivite } from "@etape/api-contract";

import { httpClient } from "@/lib/clients";
import { useListboxNavigation } from "../../hooks/use-listbox-navigation";
import { findSecteursActivite, formatSecteurActivite } from "../domain/secteur-activite";

/** Le résumé d'erreurs mène à `#secteurActivite`. */
export const SECTEUR_ACTIVITE_FIELD_ID = "secteurActivite";

export function secteurActiviteOptionId({ code }: SecteurActivite): string {
  return `${SECTEUR_ACTIVITE_FIELD_ID}-option-${code}`;
}

export const NO_SECTEUR_MESSAGE = "Aucun secteur d’activité ne correspond.";
export const SECTEURS_ERROR_MESSAGE = "La liste des secteurs d’activité est indisponible.";

export interface SecteurActiviteInputHandlers {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
}

export interface UseSecteurActiviteSearchResult {
  /** Ce que montre le champ : la saisie en cours, sinon le secteur choisi. */
  inputText: string;
  isListOpen: boolean;
  secteurs: SecteurActivite[];
  /** Quand la liste n'a aucune option : aucun secteur trouvé, ou liste indisponible. */
  emptyMessage: string;
  active: SecteurActivite | null;
  inputHandlers: SecteurActiviteInputHandlers;
  select: (secteur: SecteurActivite) => void;
}

/** Choix d'un secteur de la NAF rév. 2, par son code APE ou un mot-clé. La valeur est le code. */
export function useSecteurActiviteSearch(
  code: string,
  onChange: (code: string) => void,
): UseSecteurActiviteSearchResult {
  // `null` : pas de saisie en cours, le champ montre le secteur choisi.
  const [searchText, setSearchText] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["secteur-activite"],
    queryFn: async () =>
      getSecteursActivite.response.parse(
        (await httpClient.get<unknown>(getSecteursActivite.path)).data,
      ),
    // La nomenclature ne change pas pendant la session.
    staleTime: "static",
  });

  const selected = query.data?.find((secteur) => secteur.code === code);
  const secteurs = searchText ? findSecteursActivite(query.data ?? [], searchText) : [];

  function select(secteur: SecteurActivite): void {
    onChange(secteur.code);
    setSearchText(null);
  }

  const navigation = useListboxNavigation(secteurs, secteurActiviteOptionId, select);

  return {
    inputText: searchText ?? (selected ? formatSecteurActivite(selected) : ""),
    isListOpen: Boolean(searchText?.trim()),
    secteurs,
    emptyMessage: query.isError ? SECTEURS_ERROR_MESSAGE : NO_SECTEUR_MESSAGE,
    active: navigation.active,
    inputHandlers: {
      onChange: (event) => {
        setSearchText(event.target.value);
        // Le texte ne désigne plus le secteur choisi.
        onChange("");
        navigation.reset();
      },
      onKeyDown: (event) => {
        if (event.key === "Escape") setSearchText(null);
        else navigation.onKeyDown(event);
      },
      onBlur: () => setSearchText(null),
    },
    select,
  };
}
