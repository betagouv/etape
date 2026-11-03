import { useState } from "react";
import { flushSync } from "react-dom";

import type { Adresse } from "../components/adresse/adresse";
import {
  findRegionByCodeCommune,
  isRegionPilote,
  type RegionCode,
} from "../components/adresse/region";
import { useAdresseSearch, type UseAdresseSearchResult } from "./use-adresse-search";
import { useManualAdresse, type UseManualAdresseResult } from "./use-manual-adresse";

export const MANUAL_FIRST_FIELD_ID = "adresse-numero-voie";

export interface UseAdresseFieldResult {
  isManual: boolean;
  search: UseAdresseSearchResult;
  manual: UseManualAdresseResult;
  adresse: Adresse | null;
  region: RegionCode | undefined;
  isHorsRegion: boolean;
  isComplete: boolean;
  switchToManual: () => void;
}

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
    switchToManual: () => {
      flushSync(() => setIsManual(true));
      document.getElementById(MANUAL_FIRST_FIELD_ID)?.focus();
    },
  };
}
