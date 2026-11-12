import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";

import type { SectionProgress } from "../../domain/statut-volet";
import { VOLET_ID } from "../../domain/volet-id";
import { computeSectionProgress } from "../../domain/volet-progress";
import { useVoletProgress, type UseVoletProgressResult } from "../../hooks/use-volet-progress";
import { VOLET_FORM_OPTIONS } from "../../volet-form-options";
import { findRequiredFields } from "../domain/required-fields";
import {
  EMPLOYEUR_ENTRY_MODE,
  SITUATION_PROFESSIONNELLE_FIELD_LABEL,
  SITUATION_PROFESSIONNELLE_SECTION,
  situationProfessionnelleSchema,
  type SituationProfessionnelleFormData,
  type SituationProfessionnelleSection,
} from "../schema";

/** Ce que renvoie `useSituationProfessionnelleForm` : le formulaire et ce qui s'en déduit pour l'écran. */
export interface UseSituationProfessionnelleFormResult extends Omit<
  UseVoletProgressResult<SituationProfessionnelleSection>,
  "requiredFields"
> {
  form: UseFormReturn<SituationProfessionnelleFormData>;
  sections: Record<SituationProfessionnelleSection, SectionProgress>;
}

/** Le formulaire « Ma situation professionnelle » et ce qui s'en déduit pendant le rendu. */
export function useSituationProfessionnelleForm(): UseSituationProfessionnelleFormResult {
  const form = useForm<SituationProfessionnelleFormData>({
    ...VOLET_FORM_OPTIONS,
    resolver: zodResolver(situationProfessionnelleSchema),
    defaultValues: {
      employeurEntryMode: EMPLOYEUR_ENTRY_MODE.SEARCH,
      employeur: null,
      denomination: "",
      siret: "",
      secteurActivite: "",
      adresse: "",
      intitulePoste: "",
      demission: undefined,
      dateDemission: "",
    },
  });

  const { errors } = form.formState;
  const { requiredFields, ...voletProgress } = useVoletProgress(
    form,
    errors,
    VOLET_ID.SITUATION_PROFESSIONNELLE,
    SITUATION_PROFESSIONNELLE_FIELD_LABEL,
    findRequiredFields,
  );

  // Un littéral plutôt qu'un `Object.fromEntries` casté : une section ajoutée sans compteur ne compile pas.
  const sections: Record<SituationProfessionnelleSection, SectionProgress> = {
    [SITUATION_PROFESSIONNELLE_SECTION.EMPLOI]: computeSectionProgress(
      requiredFields,
      SITUATION_PROFESSIONNELLE_SECTION.EMPLOI,
      errors,
    ),
    [SITUATION_PROFESSIONNELLE_SECTION.DEMISSION]: computeSectionProgress(
      requiredFields,
      SITUATION_PROFESSIONNELLE_SECTION.DEMISSION,
      errors,
    ),
  };

  return {
    form,
    ...voletProgress,
    sections,
  };
}
