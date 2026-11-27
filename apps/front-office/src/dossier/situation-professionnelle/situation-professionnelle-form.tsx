import { Controller, useWatch } from "react-hook-form";

import { FormField } from "@etape/ui/components/form-field";
import { FormRadioGroup } from "@etape/ui/components/form-radio-group";
import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { Input } from "@etape/ui/components/input";
import { Separator } from "@etape/ui/components/separator";
import { StatusRegion } from "@etape/ui/components/status-region";

import { SectionCounter } from "../components/section-counter";
import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { DateField } from "../components/date-field";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { isOui, OUI_NON_LABEL } from "../domain/oui-non";
import { useErrorsAlert } from "../hooks/use-errors-alert";
import { EmployeurField } from "./components/employeur-field";
import { computeDateDemissionCalendar } from "./domain/date-demission";
import {
  REQUIRED_DEMISSION_FIELDS,
  SITUATION_PROFESSIONNELLE_FIELD,
  SITUATION_PROFESSIONNELLE_FIELD_LABEL,
  SITUATION_PROFESSIONNELLE_SECTION,
  type SituationProfessionnelleFormData,
} from "./schema";

/** Ce que reçoit `SituationProfessionnelleForm` : l'`id` du formulaire et la suite d'un envoi valide. */
export interface SituationProfessionnelleFormProps {
  formId: string;
  onSubmitValid: (data: SituationProfessionnelleFormData) => void;
}

/** Le volet « Ma situation professionnelle » : l'emploi occupé, puis la démission. */
export function SituationProfessionnelleForm({
  formId,
  onSubmitValid,
}: SituationProfessionnelleFormProps) {
  const { form, sections, voletErrors, errorAnnouncement } =
    useDossierVolets().situationProfessionnelle;
  const { submitCount } = form.formState;
  const demission = useWatch({
    control: form.control,
    name: SITUATION_PROFESSIONNELLE_FIELD.DEMISSION,
  });
  const { ref: errorsAlertRef, errors: submittedErrors } = useErrorsAlert(submitCount, voletErrors);

  return (
    <>
      <VoletErrorsAlert ref={errorsAlertRef} errors={submittedErrors} />
      <StatusRegion message={errorAnnouncement} />

      <form
        id={formId}
        noValidate
        onSubmit={form.handleSubmit(onSubmitValid)}
        className="flex flex-col gap-6"
      >
        <FormSection>
          <FormSectionHeader>
            <FormSectionTitle>Votre emploi</FormSectionTitle>
            <SectionCounter progress={sections[SITUATION_PROFESSIONNELLE_SECTION.EMPLOI]} />
          </FormSectionHeader>

          <EmployeurField form={form} />

          <FormField
            name={SITUATION_PROFESSIONNELLE_FIELD.INTITULE_POSTE}
            control={form.control}
            label={SITUATION_PROFESSIONNELLE_FIELD_LABEL.intitulePoste}
            required
            description="Par exemple : comptable, chef d’équipe logistique"
            render={({ field, attributes }) => <Input {...field} {...attributes} />}
          />
        </FormSection>

        <Separator />

        <FormSection>
          <FormSectionHeader>
            <FormSectionTitle>Votre démission</FormSectionTitle>
            <SectionCounter progress={sections[SITUATION_PROFESSIONNELLE_SECTION.DEMISSION]} />
          </FormSectionHeader>

          <FormRadioGroup
            name={SITUATION_PROFESSIONNELLE_FIELD.DEMISSION}
            control={form.control}
            label={SITUATION_PROFESSIONNELLE_FIELD_LABEL.demission}
            options={OUI_NON_LABEL}
            // Après « non », la date n'est plus demandée : son erreur ne doit pas rester au résumé.
            onValueChange={(value) => {
              if (!isOui(value)) form.clearErrors([...REQUIRED_DEMISSION_FIELDS]);
            }}
          />

          {isOui(demission) && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name={SITUATION_PROFESSIONNELLE_FIELD.DATE_DEMISSION}
                control={form.control}
                render={({ field, fieldState }) => (
                  <DateField
                    id={SITUATION_PROFESSIONNELLE_FIELD.DATE_DEMISSION}
                    label={SITUATION_PROFESSIONNELLE_FIELD_LABEL.dateDemission}
                    description="Date de l’accusé de réception ou de la remise en main propre contre décharge. Format : JJ/MM/AAAA"
                    getCalendar={computeDateDemissionCalendar}
                    field={field}
                    error={fieldState.error}
                  />
                )}
              />
            </div>
          )}
        </FormSection>
      </form>
    </>
  );
}
