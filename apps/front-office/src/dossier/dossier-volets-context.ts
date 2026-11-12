import { createContext } from "react";

import type { VoletProgress } from "./domain/statut-volet";
import type { VoletId } from "./domain/volet-id";
import type { UseInformationsFormResult } from "./informations/hooks/use-informations-form";
import type { UseSituationProfessionnelleFormResult } from "./situation-professionnelle/hooks/use-situation-professionnelle-form";

/** Les formulaires des volets et l'avancement de chacun, tels que `DossierScreen` les met en contexte. */
export interface DossierVolets {
  informations: UseInformationsFormResult;
  situationProfessionnelle: UseSituationProfessionnelleFormResult;
  voletProgress: Partial<Record<VoletId, VoletProgress>>;
}

/**
 * Un contexte plutôt qu'une propriété : les écrans de volet sont rendus par l'`Outlet`
 * du routeur, `DossierScreen` ne peut rien leur passer. Les formulaires vivent au niveau
 * du dossier pour que l'en-tête et la barre latérale reflètent la saisie en cours, sans
 * qu'un volet ait à remonter son avancement par effet.
 */
export const DossierVoletsContext = createContext<DossierVolets | null>(null);
