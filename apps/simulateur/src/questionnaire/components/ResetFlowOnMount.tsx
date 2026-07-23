"use client";

import * as React from "react";

import { flowStore } from "../state/flow-store";

/**
 * Réinitialise le flow au montage. Monté sur l'accueil : revenir à l'accueil
 * ("Quitter" / "Retour à l'accueil") puis relancer repart de la 1re question,
 * au lieu de reprendre l'état précédent (ex. écran terminal). Le refresh EN
 * COURS de questionnaire n'est pas concerné (l'accueil n'y est pas monté).
 */
export function ResetFlowOnMount() {
  React.useEffect(() => {
    flowStore.dispatch({ type: "RESET" });
  }, []);

  return null;
}
