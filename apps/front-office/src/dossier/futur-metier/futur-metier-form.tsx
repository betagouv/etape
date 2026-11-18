import { CharacterCountTextarea } from "@etape/ui/components/character-count-textarea";
import { FormField } from "@etape/ui/components/form-field";
import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { Input } from "@etape/ui/components/input";
import { StatusRegion } from "@etape/ui/components/status-region";

import { SectionCounter } from "../components/section-counter";
import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { VoletNotice } from "../components/volet-notice";
import { formatCharacterCount } from "../domain/format-character-count";
import type { VoletNoticeContent } from "../domain/volets";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { useErrorsAlert } from "../hooks/use-errors-alert";
import { MetierViseField } from "./components/metier-vise-field";
import {
  FUTUR_METIER_FIELD_LABEL,
  FUTUR_METIER_SECTION,
  FUTUR_METIER_TEXT_MAX_LENGTH,
  type FuturMetierFormData,
} from "./schema";

/** Ce que reçoit `FuturMetierForm` : l'`id` du formulaire, l'encart du volet et la suite d'un envoi valide. */
export interface FuturMetierFormProps {
  formId: string;
  notice?: VoletNoticeContent;
  onSubmitValid: (data: FuturMetierFormData) => void;
}

/** Le volet « Mon futur métier » : le métier visé, puis ce que le bénéficiaire en sait. */
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

          <FormField
            name="specialisation"
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.specialisation}
            description="Par exemple : pâtisserie, gériatrie"
            render={({ field, attributes }) => <Input {...field} {...attributes} />}
          />

          <FormField
            name="quotidienMetier"
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.quotidienMetier}
            required
            description="Principales activités, environnement et conditions de travail."
            render={({ field, attributes }) => (
              <CharacterCountTextarea
                {...field}
                {...attributes}
                maxLength={FUTUR_METIER_TEXT_MAX_LENGTH}
                countLabel={formatCharacterCount(field.value.length, FUTUR_METIER_TEXT_MAX_LENGTH)}
              />
            )}
          />

          <FormField
            name="conditionsEmploi"
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.conditionsEmploi}
            required
            description="Modes de recrutement, types de contrats proposés (CDI, CDD, temps partiel…)."
            render={({ field, attributes }) => (
              <CharacterCountTextarea
                {...field}
                {...attributes}
                maxLength={FUTUR_METIER_TEXT_MAX_LENGTH}
                countLabel={formatCharacterCount(field.value.length, FUTUR_METIER_TEXT_MAX_LENGTH)}
              />
            )}
          />

          <FormField
            name="debouches"
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.debouches}
            required
            description="Nombre d’offres d’emploi, offres non pourvues, candidats par offre…"
            render={({ field, attributes }) => (
              <CharacterCountTextarea
                {...field}
                {...attributes}
                maxLength={FUTUR_METIER_TEXT_MAX_LENGTH}
                countLabel={formatCharacterCount(field.value.length, FUTUR_METIER_TEXT_MAX_LENGTH)}
              />
            )}
          />
        </FormSection>
      </form>
    </>
  );
}
