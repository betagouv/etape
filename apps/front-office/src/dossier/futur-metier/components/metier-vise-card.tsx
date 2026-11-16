import type { AppellationRome } from "@etape/api-contract";
import { FileDigitIcon, FileTextIcon } from "lucide-react";

import { SelectionCard } from "@etape/ui/components/selection-card";

/** Ce que reçoit `MetierViseCard` : l'appellation choisie et de quoi en changer. */
export interface MetierViseCardProps {
  appellationRome: AppellationRome;
  /** Vrai quand la carte vient d'être choisie : le focus passe au bouton, le champ ayant disparu. */
  isFocusRequested: boolean;
  onChange: () => void;
}

/** Le métier visé, tel que le ROME le décrit. */
export function MetierViseCard({
  appellationRome,
  isFocusRequested,
  onChange,
}: MetierViseCardProps) {
  return (
    <SelectionCard
      title={appellationRome.libelle}
      changeLabel="Changer de métier"
      details={[
        { Icon: FileTextIcon, label: "Fiche métier", value: appellationRome.metierRome.libelle },
        { Icon: FileDigitIcon, label: "Code ROME", value: appellationRome.metierRome.code },
      ]}
      source="Informations issues du référentiel ROME de France Travail"
      isFocusRequested={isFocusRequested}
      onChange={onChange}
    />
  );
}
