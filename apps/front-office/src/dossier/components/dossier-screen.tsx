import { Outlet } from "@tanstack/react-router";

import { Surface } from "@etape/ui/components/surface";

import { useDocumentsForm } from "../documents/hooks/use-documents-form";
import { computeDossierProgress } from "../domain/progress";
import { STATUT_DOSSIER } from "../domain/statut-dossier";
import { VOLET_ID } from "../domain/volet-id";
import { VOLETS_DOSSIER } from "../domain/volets-dossier";
import { DossierVoletsContext } from "../dossier-volets-context";
import { useFormationForm } from "../formation/hooks/use-formation-form";
import { useFuturMetierForm } from "../futur-metier/hooks/use-futur-metier-form";
import { useInformationsForm } from "../informations/hooks/use-informations-form";
import { useProjetForm } from "../projet/hooks/use-projet-form";
import { useSituationProfessionnelleForm } from "../situation-professionnelle/hooks/use-situation-professionnelle-form";
import { DossierHeader } from "./dossier-header";

/** En-tête du dossier, commun à toutes ses étapes, et formulaires des volets. */
export function DossierScreen() {
  const informations = useInformationsForm();
  const situationProfessionnelle = useSituationProfessionnelleForm();
  const futurMetier = useFuturMetierForm();
  const projet = useProjetForm();
  const formation = useFormationForm();
  const documents = useDocumentsForm();
  const voletProgress = {
    [VOLET_ID.INFORMATIONS]: informations.progress,
    [VOLET_ID.SITUATION_PROFESSIONNELLE]: situationProfessionnelle.progress,
    [VOLET_ID.FUTUR_METIER]: futurMetier.progress,
    [VOLET_ID.PROJET]: projet.progress,
    [VOLET_ID.FORMATION]: formation.progress,
    [VOLET_ID.DOCUMENTS]: documents.progress,
  };
  const { completed } = computeDossierProgress(Object.values(voletProgress));

  return (
    <DossierVoletsContext
      value={{
        informations,
        situationProfessionnelle,
        futurMetier,
        projet,
        formation,
        documents,
        voletProgress,
      }}
    >
      <Surface surface="page" className="flex-1">
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
      </Surface>
    </DossierVoletsContext>
  );
}
