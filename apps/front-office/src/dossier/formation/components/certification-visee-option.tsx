import type { Certification } from "@etape/api-contract";

import { ComboboxOptionDetail, ComboboxOptionTitle } from "@etape/ui/components/combobox";

import {
  formatCertificateurs,
  formatCertificationTitle,
  formatNiveauOption,
  formatNumeroFicheLabel,
} from "../domain/format-certification";

/** Ce que reçoit `CertificationViseeOption` : la fiche de la ligne. */
export interface CertificationViseeOptionProps {
  certification: Certification;
}

/** Une fiche RNCP ou RS dans la liste des résultats de la recherche du diplôme (maquette 03). */
export function CertificationViseeOption({ certification }: CertificationViseeOptionProps) {
  const certificateurs = formatCertificateurs(certification);

  return (
    <>
      <ComboboxOptionTitle>{formatCertificationTitle(certification)}</ComboboxOptionTitle>
      {certificateurs !== null && (
        <ComboboxOptionDetail label="Certificateur">{certificateurs}</ComboboxOptionDetail>
      )}
      <ComboboxOptionDetail label="Code">
        {formatNumeroFicheLabel(certification.numeroFiche)}
      </ComboboxOptionDetail>
      <ComboboxOptionDetail label="Niveau RNCP">
        {formatNiveauOption(certification.niveau)}
      </ComboboxOptionDetail>
    </>
  );
}
