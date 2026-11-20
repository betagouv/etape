import { NotFoundScreen } from "@etape/session";
import { useNavigate, useParams } from "@tanstack/react-router";

import { VOLET_PATH, VOLET_ROUTE_ID } from "@/navigation/paths";
import { findVoletPosition } from "../domain/volets";
import { VOLETS_DOSSIER } from "../domain/volets-dossier";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { useVoletHeadingFocus } from "../hooks/use-volet-heading-focus";
import { VOLET_FORMS } from "../volet-forms";
import { FormLayout } from "./form-layout";
import { VoletNotice } from "./volet-notice";

/** Volet désigné par l'adresse. */
export function VoletScreen() {
  const { voletId, dossierId } = useParams({ from: VOLET_ROUTE_ID });
  const navigate = useNavigate();
  const headingRef = useVoletHeadingFocus(voletId);
  const position = findVoletPosition(VOLETS_DOSSIER, voletId);
  const { voletProgress } = useDossierVolets();

  if (!position) return <NotFoundScreen />;

  const VoletForm = VOLET_FORMS[voletId];

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
      formId={VoletForm ? voletId : undefined}
    >
      {VoletForm ? (
        <VoletForm
          formId={voletId}
          notice={position.current.notice}
          onSubmitValid={goToNextVolet}
        />
      ) : (
        <VoletNotice notice={position.current.notice} />
      )}
    </FormLayout>
  );
}
