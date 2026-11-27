import { Button } from "@etape/ui/components/button";
import { FieldDescription } from "@etape/ui/components/field";
import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { Separator } from "@etape/ui/components/separator";

import { PiecesJustificativesField } from "../../components/pieces-justificatives-field";
import { VoletLink } from "../../components/volet-link";
import { formatRemovalNotice } from "../../domain/piece-justificative";
import { findVoletLabel } from "../../domain/volets-dossier";
import {
  DEMARCHES_DISPLAY,
  DEMARCHES_VOLET_TITLE,
  EMPTY_DEMARCHES_TEXT,
  formatEmptyDemarchesHint,
} from "../domain/document-demarche";
import { useDemarchesGroups, type DemarchesGroup } from "../hooks/use-documents-demarches";
import { FacultatifTag } from "./facultatif-tag";

/** Ce que reçoit `DemarchesGroupView` : les démarches d'un volet, telles que « Mes documents » les montre. */
interface DemarchesGroupViewProps {
  group: DemarchesGroup;
}

/** Le sous-titre d'un volet, puis un document par démarche validée, ou le texte vide (maquette, écrans 01 et 16). */
function DemarchesGroupView({ group }: DemarchesGroupViewProps) {
  const voletLabel = findVoletLabel(group.voletId);

  return (
    <div className="flex flex-col gap-3">
      <FormSectionTitle size="subtitle" asChild>
        <h4>{DEMARCHES_VOLET_TITLE[group.voletId]}</h4>
      </FormSectionTitle>
      {group.display === DEMARCHES_DISPLAY.EMPTY ? (
        <div className="flex flex-col items-start gap-1">
          <FieldDescription>
            {EMPTY_DEMARCHES_TEXT}
            <br />
            {formatEmptyDemarchesHint(voletLabel)}
          </FieldDescription>
          <Button asChild variant="link" size="sm">
            <VoletLink voletId={group.voletId}>Compléter mes démarches</VoletLink>
          </Button>
        </div>
      ) : (
        group.documents.map(({ demarche, title, description }) => (
          <PiecesJustificativesField
            key={demarche.id}
            pieces={demarche.piecesJustificatives}
            onChange={(pieces) => group.changePieces(demarche.id, pieces)}
            labels={{ title, description, removalNotice: formatRemovalNotice(voletLabel) }}
            variant="card"
          />
        ))
      )}
    </div>
  );
}

/**
 * « Justificatifs de vos démarches » : les démarches de « Mon futur métier » et de « Mon projet »,
 * avec leurs pièces. Absente, avec son séparateur, tant qu'aucun des deux volets n'a « oui ».
 */
export function DocumentsDemarches() {
  const groups = useDemarchesGroups();
  if (groups.length === 0) return null;

  return (
    <>
      <FormSection>
        <div className="flex flex-col gap-3">
          <FormSectionHeader>
            <FormSectionTitle>Justificatifs de vos démarches</FormSectionTitle>
            <FacultatifTag />
          </FormSectionHeader>
          <FieldDescription>
            Attestations, comptes-rendus, synthèses… Les documents qui attestent les démarches
            déclarées dans votre dossier.
          </FieldDescription>
        </div>
        {groups.map((group) => (
          <DemarchesGroupView key={group.voletId} group={group} />
        ))}
      </FormSection>
      <Separator />
    </>
  );
}
