import { useState } from "react";

import type { Adresse } from "../components/adresse/adresse";
import {
  findRegionByCodeCommune,
  isRegionPilote,
  type RegionCode,
} from "../components/adresse/region";
import { useAdresseSearch, type UseAdresseSearchResult } from "./use-adresse-search";
import {
  MANUAL_FIELD_ID,
  useManualAdresse,
  type UseManualAdresseResult,
} from "./use-manual-adresse";

/** Champ de recherche, cible du focus quand l'adresse manque. */
export const ADRESSE_SEARCH_INPUT_ID = "adresse-search";

/** État du champ adresse, en recherche ou en saisie manuelle. */
export interface UseAdresseFieldResult {
  isManual: boolean;
  search: UseAdresseSearchResult;
  manual: UseManualAdresseResult;
  adresse: Adresse | null;
  region: RegionCode | undefined;
  isHorsRegion: boolean;
  isComplete: boolean;
  firstMissingFieldId: string | undefined;
  switchToManual: () => void;
  clearSearch: () => void;
  retrySearch: () => void;
}

const focusSearchInput = (): void => document.getElementById(ADRESSE_SEARCH_INPUT_ID)?.focus();

/** Champ adresse : choisit entre recherche et saisie manuelle, et vérifie la région pilote. */
export function useAdresseField(
  initial: Adresse | null,
  regionsPilotes: readonly string[],
): UseAdresseFieldResult {
  const [isManual, setIsManual] = useState(false);
  const search = useAdresseSearch(initial);
  const manual = useManualAdresse();

  const adresse = isManual ? manual.adresse : search.chosen;
  const region = adresse === null ? undefined : findRegionByCodeCommune(adresse.codeCommune);
  const isHorsRegion = adresse !== null && !isRegionPilote(region, regionsPilotes);
  const isComplete = adresse !== null && !isHorsRegion;
  const incompleteFieldId = isManual
    ? (manual.firstMissingFieldId ?? MANUAL_FIELD_ID.CODE_POSTAL)
    : ADRESSE_SEARCH_INPUT_ID;

  return {
    isManual,
    search,
    manual,
    adresse,
    region,
    isHorsRegion,
    isComplete,
    firstMissingFieldId: isComplete ? undefined : incompleteFieldId,
    switchToManual: () => setIsManual(true),
    clearSearch: () => {
      search.clear();
      focusSearchInput();
    },
    retrySearch: () => {
      search.retry();
      focusSearchInput();
    },
  };
}
