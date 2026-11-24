import { CardTitleValue } from "@etape/ui/components/card";

import { formatDemarcheLabel } from "../domain/demarche";

/** Ce que reçoit `DemarcheTitle` : le rang de la démarche validée dans la liste, à partir de 0, et ce qui la nomme. */
export interface DemarcheTitleProps {
  index: number;
  /** Le libellé de son type, ou sa précision pour « Autre » (`findDemarcheIntitule`). */
  intitule: string;
}

/** « Démarche 1 : Salon, forum ou job dating », à poser dans un `CardTitle` en variante `label` (maquettes 12 et 15). */
export function DemarcheTitle({ index, intitule }: DemarcheTitleProps) {
  return (
    <>
      {formatDemarcheLabel(index)} : <CardTitleValue>{intitule}</CardTitleValue>
    </>
  );
}
