import type { Certification } from "@etape/api-contract";
import { FileDigitIcon, LayersIcon, SchoolIcon } from "lucide-react";

import { SelectionCard } from "@etape/ui/components/selection-card";

import {
  formatCertificateurs,
  formatCertificationTitle,
  formatNiveauCard,
  formatNumeroFicheLabel,
} from "../domain/format-certification";

/** Ce que reçoit `CertificationViseeCard` : la fiche choisie et de quoi en changer. */
export interface CertificationViseeCardProps {
  certification: Certification;
  /** Vrai quand la carte vient d'être choisie : le focus passe au bouton, le champ ayant disparu. */
  isFocusRequested: boolean;
  onChange: () => void;
}

/** Le diplôme visé, tel que France compétences le décrit (maquette 04). */
export function CertificationViseeCard({
  certification,
  isFocusRequested,
  onChange,
}: CertificationViseeCardProps) {
  return (
    <SelectionCard
      title={formatCertificationTitle(certification)}
      details={[
        {
          Icon: LayersIcon,
          label: "Niveau de qualification",
          value: formatNiveauCard(certification.niveau),
        },
        { Icon: SchoolIcon, label: "Certificateur", value: formatCertificateurs(certification) },
        {
          Icon: FileDigitIcon,
          label: "Code",
          value: formatNumeroFicheLabel(certification.numeroFiche),
        },
      ]}
      source="Informations issues des répertoires RNCP et RS de France compétences"
      changeButton={{ label: "Changer de certification", isFocusRequested, onClick: onChange }}
    />
  );
}
