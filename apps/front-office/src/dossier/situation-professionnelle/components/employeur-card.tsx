import type { Etablissement } from "@etape/api-contract";
import { BriefcaseBusinessIcon, FileDigitIcon, MapPinnedIcon, SignpostIcon } from "lucide-react";

import { SelectionCard } from "@etape/ui/components/selection-card";

import { formatSiret } from "../domain/format-siret";

/** Ce que reçoit `EmployeurCard` : l'établissement choisi et de quoi en changer. */
export interface EmployeurCardProps {
  etablissement: Etablissement;
  /** Vrai quand la carte vient d'être choisie : le focus passe au bouton, le champ ayant disparu. */
  isFocusRequested: boolean;
  onChange: () => void;
}

/** L'établissement choisi, tel que Sirene le décrit. */
export function EmployeurCard({ etablissement, isFocusRequested, onChange }: EmployeurCardProps) {
  return (
    <SelectionCard
      title={etablissement.denomination}
      // Sirene ne donne pas toujours l'enseigne ni un secteur de la NAF rév. 2 : `null`, sans ligne.
      details={[
        { Icon: SignpostIcon, label: "Enseigne", value: etablissement.enseigne },
        { Icon: MapPinnedIcon, label: "Adresse", value: etablissement.adresse },
        { Icon: FileDigitIcon, label: "SIRET", value: formatSiret(etablissement.siret) },
        {
          Icon: BriefcaseBusinessIcon,
          label: "Secteur d’activité",
          value: etablissement.secteurActivite,
        },
      ]}
      source="Informations issues du répertoire Sirene de l’Insee"
      changeButton={{ label: "Changer l’entreprise", isFocusRequested, onClick: onChange }}
    />
  );
}
