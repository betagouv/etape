import { NotFoundScreen } from "@etape/session";
import { useNavigate, useParams } from "@tanstack/react-router";

import { VOLET_PATH, VOLET_ROUTE_ID } from "@/navigation/paths";
import { VOLET_ID } from "../domain/volet-id";
import { findVoletPosition } from "../domain/volets";
import { SUPPORT_EMAIL, VOLETS_DOSSIER } from "../domain/volets-dossier";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { useVoletHeadingFocus } from "../hooks/use-volet-heading-focus";
import { InformationsForm } from "../informations/informations-form";
import { SituationProfessionnelleForm } from "../situation-professionnelle/situation-professionnelle-form";
import { FormLayout } from "./form-layout";
import { VoletNotice } from "./volet-notice";

/** Volet désigné par l'adresse. */
export function VoletScreen() {
  const { voletId, dossierId } = useParams({ from: VOLET_ROUTE_ID });
  const navigate = useNavigate();
  const headingRef = useVoletHeadingFocus(voletId);
  const position = findVoletPosition(VOLETS_DOSSIER, voletId);
  const { informations, situationProfessionnelle, voletProgress } = useDossierVolets();

  if (!position) return <NotFoundScreen />;

  const isInformations = voletId === VOLET_ID.INFORMATIONS;
  const isSituationProfessionnelle = voletId === VOLET_ID.SITUATION_PROFESSIONNELLE;
  const hasForm = isInformations || isSituationProfessionnelle;

  function goToNextVolet(): void {
    if (position?.next) {
      navigate({
        from: VOLET_PATH,
        to: VOLET_PATH,
        params: { dossierId, voletId: position.next.id },
      });
    }
  }

  return (
    <FormLayout
      volets={VOLETS_DOSSIER}
      voletProgress={voletProgress}
      position={position}
      headingRef={headingRef}
      formId={hasForm ? voletId : undefined}
    >
      {isInformations ? (
        <InformationsForm
          formId={VOLET_ID.INFORMATIONS}
          informations={informations}
          // Nom, prénom, e-mail, adresse : en attendant l'API.
          prefilledValues={{ nom: "", prenom: "", email: "", adresse: "" }}
          supportEmail={SUPPORT_EMAIL}
          notice={position.current.notice}
          onSubmitValid={goToNextVolet}
        />
      ) : isSituationProfessionnelle ? (
        <SituationProfessionnelleForm
          formId={VOLET_ID.SITUATION_PROFESSIONNELLE}
          situationProfessionnelle={situationProfessionnelle}
          onSubmitValid={goToNextVolet}
        />
      ) : (
        <VoletNotice notice={position.current.notice} />
      )}
    </FormLayout>
  );
}
