import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSecteursActivite, type SecteurActivite } from "@etape/api-contract";

import { httpClient } from "@/lib/clients";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { useListboxNavigation } from "../../hooks/use-listbox-navigation";
import {
  findSecteurAnnouncement,
  findSecteurBlurOutcome,
  findSecteurEmptyMessage,
  findSecteursActivite,
  formatSecteurActivite,
  SECTEUR_BLUR_OUTCOME,
} from "../domain/secteur-activite";

/** Le résumé d'erreurs mène à `#secteurActivite`. */
export const SECTEUR_ACTIVITE_FIELD_ID = "secteurActivite";

/** L'id de l'option d'un secteur, que désigne l'`aria-activedescendant` du champ. */
export function secteurActiviteOptionId({ code }: SecteurActivite): string {
  return `${SECTEUR_ACTIVITE_FIELD_ID}-option-${code}`;
}

/** Une lettre en retient des centaines sur 732 : au-delà, on invite à préciser la recherche. */
const SECTEURS_DISPLAY_LIMIT = 50;

/** La liste se filtre à chaque frappe : on n'annonce que le nombre où la saisie s'arrête. */
const ANNOUNCEMENT_DELAY_MS = 300;

export interface SecteurActiviteInputHandlers {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
}

export interface UseSecteurActiviteSearchResult {
  /** Ce que montre le champ : la saisie en cours, sinon le secteur choisi. */
  inputText: string;
  isListOpen: boolean;
  secteurs: SecteurActivite[];
  /** Quand la liste n'a aucune option : chargement, aucun secteur trouvé, ou liste indisponible. */
  emptyMessage: string;
  /** Sous la liste quand elle est tronquée, vide sinon. */
  moreMessage: string;
  /** Pour la région `role="status"` : vide tant que la liste est fermée. */
  announcement: string;
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
  // Le texte reste au départ du champ ; seule la liste se ferme, et se rouvre au focus ou à la frappe.
  const [isOpen, setOpen] = useState(false);

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
  const matches = searchText ? findSecteursActivite(query.data ?? [], searchText) : [];
  const secteurs = matches.slice(0, SECTEURS_DISPLAY_LIMIT);

  function select(secteur: SecteurActivite): void {
    onChange(secteur.code);
    setSearchText(null);
    setOpen(false);
  }

  const navigation = useListboxNavigation(secteurs, secteurActiviteOptionId, select);

  const isListOpen = isOpen && Boolean(searchText?.trim());
  const emptyMessage = findSecteurEmptyMessage(query.isPending, query.isError);
  const moreMessage =
    matches.length > secteurs.length
      ? `${matches.length} secteurs correspondent : précisez votre recherche pour voir les autres.`
      : "";
  const announcement = useDebouncedValue(
    findSecteurAnnouncement(isListOpen, secteurs.length, emptyMessage, moreMessage),
    ANNOUNCEMENT_DELAY_MS,
  );

  return {
    inputText: searchText ?? (selected ? formatSecteurActivite(selected) : ""),
    isListOpen,
    secteurs,
    emptyMessage,
    moreMessage,
    announcement,
    active: navigation.active,
    inputHandlers: {
      // Le code reste tant qu'aucune nouvelle sélection n'est faite : Échap ou un texte non reconnu reviennent au secteur choisi.
      onChange: (event) => {
        setSearchText(event.target.value);
        setOpen(true);
        navigation.reset();
      },
      onKeyDown: (event) => {
        if (event.key === "Escape") {
          setOpen(false);
          navigation.reset();
          if (selected) setSearchText(null);
        } else if (isListOpen) {
          // Liste fermée : ni flèche ni Entrée ne désignent une option masquée.
          navigation.onKeyDown(event);
        }
      },
      onFocus: () => setOpen(true),
      onBlur: () => {
        setOpen(false);
        const result = findSecteurBlurOutcome(query.data ?? [], searchText, selected !== undefined);
        if (result.outcome === SECTEUR_BLUR_OUTCOME.SELECT) select(result.secteur);
        else if (result.outcome === SECTEUR_BLUR_OUTCOME.CLEAR) {
          onChange("");
          setSearchText(null);
        } else if (result.outcome === SECTEUR_BLUR_OUTCOME.RESTORE) setSearchText(null);
      },
    },
    select,
  };
}
