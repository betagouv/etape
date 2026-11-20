import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { StatusRegion } from "@etape/ui/components/status-region";

import { SectionCounter } from "../components/section-counter";
import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { VoletNotice } from "../components/volet-notice";
import type { VoletNoticeContent } from "../domain/volets";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { useErrorsAlert } from "../hooks/use-errors-alert";
import { MetierViseField } from "./components/metier-vise-field";
import { FUTUR_METIER_SECTION, type FuturMetierFormData } from "./schema";

/** Ce que reçoit `FuturMetierForm` : l'`id` du formulaire, l'encart du volet et la suite d'un envoi valide. */
export interface FuturMetierFormProps {
  formId: string;
  notice?: VoletNoticeContent;
  onSubmitValid: (data: FuturMetierFormData) => void;
}

/** Le volet « Mon futur métier » : le métier visé. */
export function FuturMetierForm({ formId, notice, onSubmitValid }: FuturMetierFormProps) {
  const { form, sections, voletErrors, errorAnnouncement } = useDossierVolets().futurMetier;
  const { submitCount } = form.formState;
  const { ref: errorsAlertRef, errors: submittedErrors } = useErrorsAlert(submitCount, voletErrors);

  return (
    <>
      <VoletErrorsAlert ref={errorsAlertRef} errors={submittedErrors} />
      <StatusRegion message={errorAnnouncement} />
      <VoletNotice notice={notice} />

      <form
        id={formId}
        noValidate
        onSubmit={form.handleSubmit(onSubmitValid)}
        className="flex flex-col gap-6"
      >
        <FormSection>
          <FormSectionHeader>
            <FormSectionTitle>Le métier</FormSectionTitle>
            <SectionCounter progress={sections[FUTUR_METIER_SECTION.METIER_VISE]} />
          </FormSectionHeader>

          <MetierViseField form={form} />
        </FormSection>
      </form>
    </>
  );
}
