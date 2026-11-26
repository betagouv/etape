import { Controller } from "react-hook-form";

import { FieldDescription } from "@etape/ui/components/field";
import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { Separator } from "@etape/ui/components/separator";

import { PiecesJustificativesField } from "../components/pieces-justificatives-field";
import { SectionCounter } from "../components/section-counter";
import { VoletNotice } from "../components/volet-notice";
import { PROGRESS_UNIT } from "../domain/statut-volet";
import type { VoletNoticeContent } from "../domain/volets";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { DocumentsDemarches } from "./components/documents-demarches";
import { FacultatifTag } from "./components/facultatif-tag";
import { DOCUMENTS_OBLIGATOIRES } from "./domain/document-obligatoire";
import { DOCUMENTS_SECTION, type DocumentsFormData } from "./schema";

/** Ce que reçoit `DocumentsForm` : l'`id` du formulaire, l'encart du volet et la suite d'un envoi. */
export interface DocumentsFormProps {
  formId: string;
  notice?: VoletNoticeContent;
  onSubmitValid: (data: DocumentsFormData) => void;
}

/** Le volet « Mes documents » : les documents obligatoires, puis les justificatifs des démarches et les documents complémentaires. */
export function DocumentsForm({ formId, notice, onSubmitValid }: DocumentsFormProps) {
  const { form, sections, describeStatutChange } = useDossierVolets().documents;

  return (
    <>
      <VoletNotice notice={notice} />

      <form
        id={formId}
        noValidate
        onSubmit={form.handleSubmit(onSubmitValid)}
        className="flex flex-col gap-6"
      >
        <FormSection>
          <FormSectionHeader>
            <FormSectionTitle>Documents obligatoires</FormSectionTitle>
            <SectionCounter
              progress={sections[DOCUMENTS_SECTION.OBLIGATOIRES]}
              unit={PROGRESS_UNIT.DOCUMENT}
            />
          </FormSectionHeader>

          {DOCUMENTS_OBLIGATOIRES.map(({ field: name, title, description, dropLabel }) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field }) => (
                <PiecesJustificativesField
                  pieces={field.value}
                  onChange={field.onChange}
                  labels={{ title, description, dropLabel }}
                  variant="card"
                  isRequired
                  describeChange={(pieces) => describeStatutChange(name, pieces)}
                />
              )}
            />
          ))}
        </FormSection>

        <Separator />

        <DocumentsDemarches />

        <FormSection>
          <FormSectionHeader>
            <FormSectionTitle>Documents complémentaires</FormSectionTitle>
            <FacultatifTag />
          </FormSectionHeader>
          <FieldDescription>
            Tout autre document utile à votre dossier, par exemple le bilan de positionnement ou les
            justificatifs de prérequis demandés par l’organisme de formation.
          </FieldDescription>
        </FormSection>
      </form>
    </>
  );
}
