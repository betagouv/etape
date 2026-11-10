import { Controller, useWatch } from "react-hook-form";

import { FieldError, FieldLegend, FieldSet } from "@etape/ui/components/field";
import { FormField } from "@etape/ui/components/form-field";
import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { Input } from "@etape/ui/components/input";
import { Label } from "@etape/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@etape/ui/components/radio-group";
import { Separator } from "@etape/ui/components/separator";
import { StatusRegion } from "@etape/ui/components/status-region";

import { SectionCounter } from "../components/section-counter";
import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { DateField, type DateFieldCalendar } from "../components/date-field";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { useErrorsAlert } from "../hooks/use-errors-alert";
import { EmployeurField } from "./components/employeur-field";
import {
  DEMISSION,
  DEMISSION_LABEL,
  SITUATION_PROFESSIONNELLE_FIELD_LABEL,
  SITUATION_PROFESSIONNELLE_SECTION,
  type SituationProfessionnelleFormData,
} from "./schema";

export interface SituationProfessionnelleFormProps {
  formId: string;
  onSubmitValid: (data: SituationProfessionnelleFormData) => void;
}

// Le résumé d'erreurs mène à `#demission` : l'id est porté par le groupe, pas par un bouton radio.
const DEMISSION_FIELD_ID = "demission";
const DEMISSION_LEGEND_ID = `${DEMISSION_FIELD_ID}-legend`;
const DEMISSION_ERROR_ID = `${DEMISSION_FIELD_ID}-error`;

// Les jours à venir ne se choisissent pas (maquette 11).
function computeDateDemissionCalendar(today: Date): DateFieldCalendar {
  return { defaultMonth: today, endMonth: today, disabled: { after: today } };
}

/** Le volet « Ma situation professionnelle » : l'emploi occupé, puis la démission. */
export function SituationProfessionnelleForm({
  formId,
  onSubmitValid,
}: SituationProfessionnelleFormProps) {
  const { form, sections, voletErrors, errorAnnouncement } =
    useDossierVolets().situationProfessionnelle;
  const { submitCount } = form.formState;
  const demission = useWatch({ control: form.control, name: "demission" });
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
            name="intitulePoste"
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

          <FieldSet>
            <FieldLegend id={DEMISSION_LEGEND_ID} variant="label" required>
              {SITUATION_PROFESSIONNELLE_FIELD_LABEL.demission}
            </FieldLegend>
            <Controller
              name="demission"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <RadioGroup
                    id={DEMISSION_FIELD_ID}
                    value={field.value ?? ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Après « non », la date n'est plus demandée : son erreur ne doit pas rester au résumé.
                      if (value === DEMISSION.NON) form.clearErrors("dateDemission");
                    }}
                    // Les flèches déplacent le focus d'un bouton à l'autre : on ne sort qu'en quittant le groupe.
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) field.onBlur();
                    }}
                    className="flex gap-5"
                    required
                    // La légende nomme le `fieldset`, pas le `radiogroup` de Radix.
                    aria-labelledby={DEMISSION_LEGEND_ID}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? DEMISSION_ERROR_ID : undefined}
                  >
                    {Object.values(DEMISSION).map((value, index) => (
                      <div key={value} className="flex items-center gap-2">
                        <RadioGroupItem
                          value={value}
                          id={`${DEMISSION_FIELD_ID}-${value}`}
                          aria-invalid={fieldState.invalid}
                          // Un seul élément peut porter le ref du champ : le premier bouton radio.
                          ref={index === 0 ? field.ref : undefined}
                        />
                        <Label htmlFor={`${DEMISSION_FIELD_ID}-${value}`}>
                          {DEMISSION_LABEL[value]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {fieldState.error && (
                    <FieldError id={DEMISSION_ERROR_ID} errors={[fieldState.error]} />
                  )}
                </>
              )}
            />
          </FieldSet>

          {demission === DEMISSION.OUI && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="dateDemission"
                control={form.control}
                render={({ field, fieldState }) => (
                  <DateField
                    id="dateDemission"
                    label={SITUATION_PROFESSIONNELLE_FIELD_LABEL.dateDemission}
                    description="Date de l’accusé de réception ou de la remise en main propre contre décharge. Format : jj/mm/aaaa"
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
