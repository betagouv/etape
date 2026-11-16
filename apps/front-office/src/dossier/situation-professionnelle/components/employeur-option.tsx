import type { Etablissement } from "@etape/api-contract";

import { ComboboxOptionDetail, ComboboxOptionTitle } from "@etape/ui/components/combobox";

import { formatSiret } from "../domain/format-siret";

/** Ce que reçoit `EmployeurOption` : l'établissement de la ligne. */
export interface EmployeurOptionProps {
  etablissement: Etablissement;
}

/** Un établissement dans la liste des résultats de la recherche d'employeur. */
export function EmployeurOption({ etablissement }: EmployeurOptionProps) {
  return (
    <>
      <ComboboxOptionTitle>{etablissement.denomination}</ComboboxOptionTitle>
      {etablissement.enseigne && (
        <ComboboxOptionDetail label="Enseigne">{etablissement.enseigne}</ComboboxOptionDetail>
      )}
      <ComboboxOptionDetail label="Adresse">{etablissement.adresse}</ComboboxOptionDetail>
      <ComboboxOptionDetail label="SIRET">{formatSiret(etablissement.siret)}</ComboboxOptionDetail>
    </>
  );
}
