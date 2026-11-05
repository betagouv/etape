import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

import type { SectionProgress, VoletProgress } from "../../domain/statut-volet";
import type { VoletError } from "../../domain/volet-errors";
import { useFieldErrorAnnouncement } from "../../hooks/use-field-error-announcement";
import {
  EMPLOYEUR_ENTRY_MODE,
  findSectionFields,
  SITUATION_PROFESSIONNELLE_FIELD_LABEL,
  situationProfessionnelleSchema,
  type Demission,
  type SituationProfessionnelleFormData,
  type SituationProfessionnelleSection,
} from "../schema";

export interface UseSituationProfessionnelleFormResult {
  form: UseFormReturn<SituationProfessionnelleFormData>;
  progress: VoletProgress;
  sections: Record<SituationProfessionnelleSection, SectionProgress>;
  voletErrors: VoletError[];
  /** Erreur du champ qu'on vient de quitter, pour la région `role="status"` de l'écran. */
  errorAnnouncement: string;
}

/** Le formulaire « Ma situation professionnelle » et ce qui s'en déduit pendant le rendu. */
export function useSituationProfessionnelleForm(): UseSituationProfessionnelleFormResult {
  const form = useForm<SituationProfessionnelleFormData>({
    resolver: zodResolver(situationProfessionnelleSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      employeurEntryMode: EMPLOYEUR_ENTRY_MODE.SEARCH,
      employeur: null,
      denomination: "",
      siret: "",
      secteurActivite: "",
      adresse: "",
      intitulePoste: "",
      demission: "" as Demission,
      dateDemission: "",
    },
    // Le focus revient au résumé d'erreurs de l'écran, pas au premier champ fautif.
    shouldFocusError: false,
  });

  const values = useWatch({ control: form.control });
  const { errors } = form.formState;
  const sectionFields = findSectionFields(
    values.employeurEntryMode ?? EMPLOYEUR_ENTRY_MODE.SEARCH,
    values.demission,
  );
  const requiredFields = Object.values(sectionFields).flat();

  const countFilled = (fields: readonly (keyof SituationProfessionnelleFormData)[]): number =>
    fields.filter((name) => Boolean(values[name])).length;

  const sections = Object.fromEntries(
    Object.entries(sectionFields).map(([section, fields]) => [
      section,
      {
        remainingFieldCount: fields.length - countFilled(fields),
        errorCount: fields.filter((name) => errors[name] !== undefined).length,
      },
    ]),
  ) as Record<SituationProfessionnelleSection, SectionProgress>;

  const filledFieldCount = countFilled(requiredFields);
  const errorAnnouncement = useFieldErrorAnnouncement(form, SITUATION_PROFESSIONNELLE_FIELD_LABEL);

  // Dans l'ordre de la page : zod place les erreurs de `superRefine` après celles des champs.
  const voletErrors: VoletError[] = requiredFields
    .filter((name) => errors[name] !== undefined)
    .map((fieldId) => ({ fieldId, message: errors[fieldId]?.message ?? "" }));

  return {
    form,
    progress: {
      requiredFieldCount: requiredFields.length,
      filledFieldCount,
      remainingFieldCount: requiredFields.length - filledFieldCount,
      errorCount: voletErrors.length,
    },
    sections,
    voletErrors,
    errorAnnouncement,
  };
}
