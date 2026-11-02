import { NotFoundScreen } from "@etape/session";
import { useNavigate, useParams } from "@tanstack/react-router";

import { VOLET_PATH, VOLET_ROUTE_ID } from "@/navigation/paths";
import { VOLET_ERRORS_DEMO, VOLETS_DEMO } from "../demo";
import { VOLET_ID } from "../domain/volet-id";
import { findVoletPosition } from "../domain/volets";
import { useVoletHeadingFocus } from "../hooks/use-volet-heading-focus";
import { InformationsForm } from "../informations/informations-form";
import { FormLayout } from "./form-layout";
import { VoletErrorsAlert } from "./volet-errors-alert";
import { VoletNotice } from "./volet-notice";

/** Volet désigné par l'adresse. */
export function VoletScreen() {
  const { voletId, dossierId } = useParams({ from: VOLET_ROUTE_ID });
  const navigate = useNavigate();
  const headingRef = useVoletHeadingFocus(voletId);
  const position = findVoletPosition(VOLETS_DEMO, voletId);

  if (!position) return <NotFoundScreen />;

  const isInformations = voletId === VOLET_ID.INFORMATIONS;

  return (
    <FormLayout
      volets={VOLETS_DEMO}
      position={position}
      headingRef={headingRef}
      formId={isInformations ? VOLET_ID.INFORMATIONS : undefined}
    >
      {isInformations ? (
        <InformationsForm
          formId={VOLET_ID.INFORMATIONS}
          notice={position.current.notice}
          onSubmitValid={() => {
            if (position.next) {
              navigate({
                from: VOLET_PATH,
                to: VOLET_PATH,
                params: { dossierId, voletId: position.next.id },
              });
            }
          }}
        />
      ) : (
        <>
          <VoletErrorsAlert errors={VOLET_ERRORS_DEMO[voletId]} />
          <VoletNotice notice={position.current.notice} />
        </>
      )}
    </FormLayout>
  );
}
