import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

import type { SectionProgress, VoletProgress } from "../../domain/statut-volet";
import type { VoletError } from "../../domain/volet-errors";
import {
  SITUATION_PROFESSIONNELLE_SECTION_FIELDS,
  situationProfessionnelleSchema,
  type Demission,
  type SituationProfessionnelleFormData,
  type SituationProfessionnelleFormValues,
  type SituationProfessionnelleSection,
} from "../schema";

export interface UseSituationProfessionnelleFormResult {
  form: UseFormReturn<
    SituationProfessionnelleFormValues,
    unknown,
    SituationProfessionnelleFormData
  >;
  progress: VoletProgress;
  sections: Record<SituationProfessionnelleSection, SectionProgress>;
  voletErrors: VoletError[];
}

const ALL_REQUIRED_FIELDS = Object.values(SITUATION_PROFESSIONNELLE_SECTION_FIELDS).flat();

function countFilled(
  values: Partial<Record<keyof SituationProfessionnelleFormValues, unknown>>,
  fields: readonly (keyof SituationProfessionnelleFormValues)[],
): number {
  return fields.filter((name) => Boolean(values[name])).length;
}

/** Le formulaire « Ma situation professionnelle » et ce qui s'en déduit pendant le rendu. */
export function useSituationProfessionnelleForm(): UseSituationProfessionnelleFormResult {
  const form = useForm<
    SituationProfessionnelleFormValues,
    unknown,
    SituationProfessionnelleFormData
  >({
    resolver: zodResolver(situationProfessionnelleSchema),
    mode: "onBlur",
    defaultValues: { employeur: null, intitulePoste: "", demission: "" as Demission },
    // Le focus revient au résumé d'erreurs de l'écran, pas au premier champ fautif.
    shouldFocusError: false,
  });

  const values = useWatch({ control: form.control });
  const { errors } = form.formState;

  const sections = Object.fromEntries(
    Object.entries(SITUATION_PROFESSIONNELLE_SECTION_FIELDS).map(([section, fields]) => [
      section,
      {
        remainingFieldCount: fields.length - countFilled(values, fields),
        errorCount: fields.filter((name) => errors[name] !== undefined).length,
      },
    ]),
  ) as Record<SituationProfessionnelleSection, SectionProgress>;

  const filledFieldCount = countFilled(values, ALL_REQUIRED_FIELDS);

  const voletErrors: VoletError[] = Object.entries(errors).map(([fieldId, error]) => ({
    fieldId,
    message: error?.message ?? "",
  }));

  return {
    form,
    progress: {
      requiredFieldCount: ALL_REQUIRED_FIELDS.length,
      filledFieldCount,
      remainingFieldCount: ALL_REQUIRED_FIELDS.length - filledFieldCount,
      errorCount: voletErrors.length,
    },
    sections,
    voletErrors,
  };
}
