import { Outlet } from "@tanstack/react-router";

import { computeDossierProgress } from "../domain/progress";
import { STATUT_DOSSIER } from "../domain/statut-dossier";
import { VOLET_ID } from "../domain/volet-id";
import { VOLETS_DOSSIER } from "../domain/volets-dossier";
import { DossierVoletsContext } from "../dossier-volets-context";
import { useInformationsForm } from "../informations/hooks/use-informations-form";
import { DossierHeader } from "./dossier-header";

/** En-tête du dossier, commun à toutes ses étapes, et formulaires des volets. */
export function DossierScreen() {
  const informations = useInformationsForm();
  const voletProgress = { [VOLET_ID.INFORMATIONS]: informations.progress };
  const { completed } = computeDossierProgress(Object.values(voletProgress));

  return (
    <DossierVoletsContext value={{ informations, voletProgress }}>
      {/* Numéro, horodatage : en attendant l'API. */}
      <DossierHeader
        title="Démission-reconversion"
        subtitle="Projet de formation"
        numero=""
        statut={STATUT_DOSSIER.BROUILLON}
        updatedAtLabel={null}
        progress={{ completed, total: VOLETS_DOSSIER.length }}
      />
      <Outlet />
    </DossierVoletsContext>
  );
}
