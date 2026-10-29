import { Outlet } from "@tanstack/react-router";

import { DOSSIER_DEMO } from "../demo";
import { DossierHeader } from "./dossier-header";

/** En-tête du dossier, commun à toutes ses étapes. */
export function DossierScreen() {
  return (
    <>
      <DossierHeader {...DOSSIER_DEMO} />
      <Outlet />
    </>
  );
}
