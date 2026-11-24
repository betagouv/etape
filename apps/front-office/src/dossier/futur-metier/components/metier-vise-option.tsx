import type { AppellationRome } from "@etape/api-contract";

import { ComboboxOptionDetail, ComboboxOptionTitle } from "@etape/ui/components/combobox";

/** Ce que reçoit `MetierViseOption` : l'appellation de la ligne. */
export interface MetierViseOptionProps {
  appellationRome: AppellationRome;
}

/** Une appellation du ROME dans la liste des résultats de la recherche du métier visé. */
export function MetierViseOption({ appellationRome }: MetierViseOptionProps) {
  return (
    <>
      <ComboboxOptionTitle>{appellationRome.libelle}</ComboboxOptionTitle>
      <ComboboxOptionDetail label="Code ROME">
        {appellationRome.metierRome.code}
      </ComboboxOptionDetail>
    </>
  );
}
