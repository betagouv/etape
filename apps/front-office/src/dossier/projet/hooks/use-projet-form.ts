import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";

import type { SectionProgress } from "../../domain/statut-volet";
import { VOLET_ID } from "../../domain/volet-id";
import { computeSectionProgress } from "../../domain/volet-progress";
import { useVoletProgress, type UseVoletProgressResult } from "../../hooks/use-volet-progress";
import { VOLET_FORM_OPTIONS } from "../../volet-form-options";
import { findSectionFields } from "../domain/section-fields";
import {
  PROJET_FIELD_LABEL,
  PROJET_SECTION,
  projetSchema,
  type ProjetFormData,
  type ProjetSection,
} from "../schema";

/** Ce que renvoie `useProjetForm` : le formulaire et ce qui s'en déduit pour l'écran. */
export interface UseProjetFormResult extends Omit<
  UseVoletProgressResult<ProjetSection>,
  "requiredFields"
> {
  form: UseFormReturn<ProjetFormData>;
  sections: Record<ProjetSection, SectionProgress>;
}

/** Le formulaire « Mon projet » et ce qui s'en déduit pendant le rendu. */
export function useProjetForm(): UseProjetFormResult {
  const form = useForm<ProjetFormData>({
    ...VOLET_FORM_OPTIONS,
    resolver: zodResolver(projetSchema),
    defaultValues: {
      motivationChangement: "",
      effetsChangement: "",
      competencesAcquises: "",
      competencesAAcquerir: "",
      demarcheConstruction: undefined,
      currentDemarche: {
        typeDemarche: undefined,
        precisionTypeDemarche: "",
        apportDemarche: "",
        piecesJustificatives: [],
      },
      hasCurrentDemarche: true,
      currentDemarcheId: null,
      demarches: [],
    },
  });

  const { errors } = form.formState;
  const { requiredFields, ...voletProgress } = useVoletProgress(
    form,
    errors,
    VOLET_ID.PROJET,
    PROJET_FIELD_LABEL,
    findSectionFields,
  );

  // Un littéral plutôt qu'un `Object.fromEntries` casté : une section ajoutée sans compteur ne compile pas.
  const sections: Record<ProjetSection, SectionProgress> = {
    [PROJET_SECTION.PROJET]: computeSectionProgress(requiredFields, PROJET_SECTION.PROJET, errors),
    [PROJET_SECTION.COMPETENCES]: computeSectionProgress(
      requiredFields,
      PROJET_SECTION.COMPETENCES,
      errors,
    ),
    [PROJET_SECTION.DEMARCHES]: computeSectionProgress(
      requiredFields,
      PROJET_SECTION.DEMARCHES,
      errors,
    ),
  };

  return {
    form,
    ...voletProgress,
    sections,
  };
}
