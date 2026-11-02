import { Outlet } from "@tanstack/react-router";

import { STATUT_DOSSIER } from "../domain/statut-dossier";
import { VOLETS_DOSSIER } from "../domain/volets-dossier";
import { DossierHeader } from "./dossier-header";

/** En-tête du dossier, commun à toutes ses étapes. */
export function DossierScreen() {
  return (
    <>
      <DossierHeader
        title="Démission-reconversion"
        subtitle="Projet de formation"
        numero=""
        statut={STATUT_DOSSIER.BROUILLON}
        updatedAtLabel={null}
        progress={{ completed: 0, total: VOLETS_DOSSIER.length }}
      />
      <Outlet />
    </>
  );
}
