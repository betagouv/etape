import { useState } from "react";

import type { Adresse } from "../components/adresse/adresse";
import {
  findRegionByCodeCommune,
  isRegionPilote,
  type RegionCode,
} from "../components/adresse/region";
import { useAdresseSearch, type UseAdresseSearchResult } from "./use-adresse-search";
import { useManualAdresse, type UseManualAdresseResult } from "./use-manual-adresse";

export const ADRESSE_SEARCH_INPUT_ID = "adresse-search";

export interface UseAdresseFieldResult {
  isManual: boolean;
  search: UseAdresseSearchResult;
  manual: UseManualAdresseResult;
  adresse: Adresse | null;
  region: RegionCode | undefined;
  isHorsRegion: boolean;
  isComplete: boolean;
  switchToManual: () => void;
  clearSearch: () => void;
  retrySearch: () => void;
}

const focusSearchInput = (): void => document.getElementById(ADRESSE_SEARCH_INPUT_ID)?.focus();

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

  return {
    isManual,
    search,
    manual,
    adresse,
    region,
    isHorsRegion,
    isComplete: adresse !== null && !isHorsRegion,
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
