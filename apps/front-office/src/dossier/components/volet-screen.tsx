import { NotFoundScreen } from "@etape/session";
import { useParams } from "@tanstack/react-router";

import { VOLET_ROUTE_ID } from "@/navigation/paths";
import { VOLET_ERRORS_DEMO, VOLETS_DEMO } from "../demo";
import { findVoletPosition } from "../domain/volets";
import { useVoletHeadingFocus } from "../hooks/use-volet-heading-focus";
import { FormLayout } from "./form-layout";
import { VoletErrorsAlert } from "./volet-errors-alert";
import { VoletNotice } from "./volet-notice";

/** Volet désigné par l'adresse. */
export function VoletScreen() {
  const { voletId } = useParams({ from: VOLET_ROUTE_ID });
  const headingRef = useVoletHeadingFocus(voletId);
  const position = findVoletPosition(VOLETS_DEMO, voletId);

  // La route n'accepte que des volets connus, mais un dossier peut ne pas les compter tous.
  if (!position) return <NotFoundScreen />;

  return (
    <FormLayout volets={VOLETS_DEMO} position={position} headingRef={headingRef}>
      <VoletErrorsAlert errors={VOLET_ERRORS_DEMO[voletId]} />
      <VoletNotice notice={position.current.notice} />
    </FormLayout>
  );
}
