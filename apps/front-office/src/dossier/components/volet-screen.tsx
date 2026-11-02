import { NotFoundScreen } from "@etape/session";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";

import { VOLET_PATH, VOLET_ROUTE_ID } from "@/navigation/paths";
import type { VoletProgress } from "../domain/statut-volet";
import { VOLET_ID, type VoletId } from "../domain/volet-id";
import { findVoletPosition } from "../domain/volets";
import { SUPPORT_EMAIL, VOLETS_DOSSIER } from "../domain/volets-dossier";
import { useVoletHeadingFocus } from "../hooks/use-volet-heading-focus";
import { InformationsForm } from "../informations/informations-form";
import { FormLayout } from "./form-layout";
import { VoletNotice } from "./volet-notice";

/** Volet désigné par l'adresse. */
export function VoletScreen() {
  const { voletId, dossierId } = useParams({ from: VOLET_ROUTE_ID });
  const navigate = useNavigate();
  const headingRef = useVoletHeadingFocus(voletId);
  const position = findVoletPosition(VOLETS_DOSSIER, voletId);
  const [voletProgress, setVoletProgress] = useState<Partial<Record<VoletId, VoletProgress>>>({});

  const handleProgressChange = useCallback(
    (volet: VoletId) => (progress: VoletProgress) => {
      setVoletProgress((prev) => ({ ...prev, [volet]: progress }));
    },
    [],
  );

  if (!position) return <NotFoundScreen />;

  const isInformations = voletId === VOLET_ID.INFORMATIONS;

  return (
    <FormLayout
      volets={VOLETS_DOSSIER}
      voletProgress={voletProgress}
      position={position}
      headingRef={headingRef}
      formId={isInformations ? VOLET_ID.INFORMATIONS : undefined}
    >
      {isInformations ? (
        <InformationsForm
          formId={VOLET_ID.INFORMATIONS}
          preRemplies={{ nom: "", prenom: "", email: "", adresse: "" }}
          supportEmail={SUPPORT_EMAIL}
          notice={position.current.notice}
          onProgressChange={handleProgressChange(VOLET_ID.INFORMATIONS)}
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
        <VoletNotice notice={position.current.notice} />
      )}
    </FormLayout>
  );
}
