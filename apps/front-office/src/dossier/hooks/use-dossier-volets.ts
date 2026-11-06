import { useContext } from "react";

import { DossierVoletsContext, type DossierVolets } from "../dossier-volets-context";

export function useDossierVolets(): DossierVolets {
  const volets = useContext(DossierVoletsContext);
  if (volets === null) {
    throw new Error("useDossierVolets s'appelle sous DossierScreen.");
  }
  return volets;
}
