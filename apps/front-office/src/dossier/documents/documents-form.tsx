import { Controller } from "react-hook-form";
import { InfoIcon } from "lucide-react";

import { FieldDescription } from "@etape/ui/components/field";
import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { Separator } from "@etape/ui/components/separator";
import { Tag } from "@etape/ui/components/tag";

import { PiecesJustificativesField } from "../components/pieces-justificatives-field";
import { SectionCounter } from "../components/section-counter";
import { VoletNotice } from "../components/volet-notice";
import { FACULTATIF_LABEL, PROGRESS_UNIT } from "../domain/statut-volet";
import type { VoletNoticeContent } from "../domain/volets";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { DOCUMENTS_OBLIGATOIRES } from "./domain/document-obligatoire";
import { DOCUMENTS_SECTION, type DocumentsFormData } from "./schema";

const FACULTATIF_TAG = (
  <Tag importance="subdued" size="sm">
    <InfoIcon aria-hidden="true" />
    {FACULTATIF_LABEL}
  </Tag>
);

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

        <FormSection>
          <div className="flex flex-col gap-3">
            <FormSectionHeader>
              <FormSectionTitle>Justificatifs de vos démarches</FormSectionTitle>
              {FACULTATIF_TAG}
            </FormSectionHeader>
            <FieldDescription>
              Attestations, comptes-rendus, synthèses… Les documents qui attestent les démarches
              déclarées dans votre dossier.
            </FieldDescription>
          </div>
        </FormSection>

        <Separator />

        <FormSection>
          <FormSectionHeader>
            <FormSectionTitle>Documents complémentaires</FormSectionTitle>
            {FACULTATIF_TAG}
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
