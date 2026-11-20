import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";

import type { SectionProgress } from "../../domain/statut-volet";
import { VOLET_ID } from "../../domain/volet-id";
import { computeSectionProgress } from "../../domain/volet-progress";
import { useVoletProgress, type UseVoletProgressResult } from "../../hooks/use-volet-progress";
import { VOLET_FORM_OPTIONS } from "../../volet-form-options";
import { findRequiredFields } from "../domain/required-fields";
import {
  FUTUR_METIER_FIELD_LABEL,
  FUTUR_METIER_SECTION,
  futurMetierSchema,
  METIER_VISE_ENTRY_MODE,
  type FuturMetierFormData,
  type FuturMetierSection,
} from "../schema";

/** Ce que renvoie `useFuturMetierForm` : le formulaire et ce qui s'en déduit pour l'écran. */
export interface UseFuturMetierFormResult extends Omit<
  UseVoletProgressResult<FuturMetierSection>,
  "requiredFields"
> {
  form: UseFormReturn<FuturMetierFormData>;
  sections: Record<FuturMetierSection, SectionProgress>;
}

/** Le formulaire « Mon futur métier » et ce qui s'en déduit pendant le rendu. */
export function useFuturMetierForm(): UseFuturMetierFormResult {
  const form = useForm<FuturMetierFormData>({
    ...VOLET_FORM_OPTIONS,
    resolver: zodResolver(futurMetierSchema),
    defaultValues: {
      metierViseEntryMode: METIER_VISE_ENTRY_MODE.SEARCH,
      metierVise: null,
      intituleMetierVise: "",
      codeRome: "",
      specialisation: "",
      quotidienMetier: "",
      conditionsEmploi: "",
      debouches: "",
      demarcheDecouverte: undefined,
      typeDemarche: undefined,
      precisionTypeDemarche: "",
      apportDemarche: "",
      piecesJustificatives: [],
      hasCurrentDemarche: true,
      demarches: [],
    },
  });

  const { errors } = form.formState;
  const { requiredFields, ...voletProgress } = useVoletProgress(
    form,
    errors,
    VOLET_ID.FUTUR_METIER,
    FUTUR_METIER_FIELD_LABEL,
    findRequiredFields,
  );

  // Un littéral plutôt qu'un `Object.fromEntries` casté : une section ajoutée sans compteur ne compile pas.
  const sections: Record<FuturMetierSection, SectionProgress> = {
    [FUTUR_METIER_SECTION.METIER_VISE]: computeSectionProgress(
      requiredFields,
      FUTUR_METIER_SECTION.METIER_VISE,
      errors,
    ),
  };

  return {
    form,
    ...voletProgress,
    sections,
  };
}
