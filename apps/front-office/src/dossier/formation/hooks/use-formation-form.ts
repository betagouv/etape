import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";

import { ENTRY_MODE } from "../../domain/entry-mode";
import type { SectionProgress } from "../../domain/statut-volet";
import { VOLET_ID } from "../../domain/volet-id";
import { computeSectionProgress } from "../../domain/volet-progress";
import { useVoletProgress, type UseVoletProgressResult } from "../../hooks/use-volet-progress";
import { VOLET_FORM_OPTIONS } from "../../volet-form-options";
import { findSectionFields, findSectionValidatedFields } from "../domain/section-fields";
import {
  FORMATION_FIELD_LABEL,
  FORMATION_SECTION,
  formationSchema,
  type FormationFormData,
  type FormationSection,
} from "../schema";

/** Ce que renvoie `useFormationForm` : le formulaire et ce qui s'en déduit pour l'écran. */
export interface UseFormationFormResult extends Omit<
  UseVoletProgressResult<FormationSection>,
  "requiredFields"
> {
  form: UseFormReturn<FormationFormData>;
  sections: Record<FormationSection, SectionProgress>;
}

/**
 * Le formulaire « Ma formation » et ce qui s'en déduit pendant le rendu. Le calendrier et le
 * programme n'y sont pas : ce sont des documents, portés par le formulaire de « Mes documents ».
 */
export function useFormationForm(): UseFormationFormResult {
  const form = useForm<FormationFormData>({
    ...VOLET_FORM_OPTIONS,
    resolver: zodResolver(formationSchema),
    defaultValues: {
      intituleFormation: "",
      certificationViseeEntryMode: ENTRY_MODE.SEARCH,
      certificationVisee: null,
      intituleCertificationVisee: "",
      numeroFiche: "",
      niveauCertification: undefined,
      dureeFormation: "",
      heuresParSemaine: "",
      dateDebutFormation: "",
      dateFinFormation: "",
      modalitesFormation: [],
      contenuFormation: "",
    },
  });

  const { errors } = form.formState;
  const { requiredFields, ...voletProgress } = useVoletProgress(
    form,
    errors,
    VOLET_ID.FORMATION,
    FORMATION_FIELD_LABEL,
    findSectionFields,
    findSectionValidatedFields,
  );

  // Un littéral plutôt qu'un `Object.fromEntries` casté : une section ajoutée sans compteur ne compile pas.
  const sections: Record<FormationSection, SectionProgress> = {
    [FORMATION_SECTION.FORMATION]: computeSectionProgress(
      requiredFields,
      FORMATION_SECTION.FORMATION,
      errors,
    ),
  };

  return {
    form,
    ...voletProgress,
    sections,
  };
}
