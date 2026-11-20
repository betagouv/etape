import { CardTitleValue } from "@etape/ui/components/card";

import { findDemarcheIntitule, formatDemarcheLabel, type Demarche } from "../domain/demarche";

/** Ce que reçoit `DemarcheTitle` : la démarche validée et son rang dans la liste, à partir de 0. */
export interface DemarcheTitleProps {
  index: number;
  demarche: Demarche;
}

/** « Démarche 1 : Salon, forum ou job dating », à poser dans un `CardTitle` en variante `label` (maquettes 12 et 15). */
export function DemarcheTitle({ index, demarche }: DemarcheTitleProps) {
  return (
    <>
      {formatDemarcheLabel(index)} :{" "}
      <CardTitleValue>{findDemarcheIntitule(demarche)}</CardTitleValue>
    </>
  );
}
