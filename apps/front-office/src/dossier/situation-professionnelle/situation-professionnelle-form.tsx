import { useEffect, useRef } from "react";
import { Controller } from "react-hook-form";

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

import { SectionCounter } from "../components/section-counter";
import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { EmployeurField } from "./components/employeur-field";
import type { UseSituationProfessionnelleFormResult } from "./hooks/use-situation-professionnelle-form";
import {
  DEMISSION,
  DEMISSION_LABEL,
  SITUATION_PROFESSIONNELLE_SECTION,
  type SituationProfessionnelleFormData,
} from "./schema";

export interface SituationProfessionnelleFormProps {
  formId: string;
  situationProfessionnelle: UseSituationProfessionnelleFormResult;
  onSubmitValid: (data: SituationProfessionnelleFormData) => void;
}

// Le résumé d'erreurs mène à `#demission` : l'id est porté par le groupe, pas par un bouton radio.
const DEMISSION_FIELD_ID = "demission";
const DEMISSION_ERROR_ID = `${DEMISSION_FIELD_ID}-error`;

export function SituationProfessionnelleForm({
  formId,
  situationProfessionnelle,
  onSubmitValid,
}: SituationProfessionnelleFormProps) {
  const { form, sections, voletErrors } = situationProfessionnelle;
  const { submitCount } = form.formState;
  const errorsAlertRef = useRef<HTMLDivElement>(null);

  // Comme dans « Mes informations » : le résumé, focalisé à chaque soumission invalide, annonce les erreurs.
  useEffect(() => {
    if (submitCount > 0) errorsAlertRef.current?.focus();
  }, [submitCount]);

  return (
    <>
      <VoletErrorsAlert ref={errorsAlertRef} errors={voletErrors} />

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
            label="Intitulé de votre poste"
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
            <FieldLegend variant="label" required>
              Avez-vous déjà remis votre démission à votre employeur ?
            </FieldLegend>
            <Controller
              name="demission"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <RadioGroup
                    id={DEMISSION_FIELD_ID}
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-5"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? DEMISSION_ERROR_ID : undefined}
                  >
                    {Object.values(DEMISSION).map((value, index) => (
                      <div key={value} className="flex items-center gap-2">
                        <RadioGroupItem
                          value={value}
                          id={`${DEMISSION_FIELD_ID}-${value}`}
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
        </FormSection>
      </form>
    </>
  );
}
