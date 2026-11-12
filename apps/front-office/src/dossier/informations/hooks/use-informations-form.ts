import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";

import type { SectionProgress } from "../../domain/statut-volet";
import { VOLET_ID } from "../../domain/volet-id";
import { computeSectionProgress } from "../../domain/volet-progress";
import { useVoletProgress, type UseVoletProgressResult } from "../../hooks/use-volet-progress";
import { VOLET_FORM_OPTIONS } from "../../volet-form-options";
import { findRequiredFields } from "../domain/required-fields";
import {
  INFORMATIONS_FIELD_LABEL,
  INFORMATIONS_SECTION,
  informationsSchema,
  type InformationsFormData,
  type InformationsSection,
} from "../schema";

/** Les valeurs reprises de l'inscription et du profil. */
export interface InformationsPrefilledValues {
  nom: string;
  prenom: string;
  email: string;
  adresse: string;
}

/** Ce que renvoie `useInformationsForm` : le formulaire et ce qui s'en déduit pour l'écran. */
export interface UseInformationsFormResult extends Omit<
  UseVoletProgressResult<InformationsSection>,
  "requiredFields"
> {
  form: UseFormReturn<InformationsFormData>;
  sections: Record<InformationsSection, SectionProgress>;
  /** Repris de l'inscription et du profil : affichés, jamais saisis ici. */
  prefilledValues: InformationsPrefilledValues;
}

// Nom, prénom, e-mail, adresse : en attendant l'API.
const PREFILLED_VALUES: InformationsPrefilledValues = {
  nom: "",
  prenom: "",
  email: "",
  adresse: "",
};

/** Le formulaire « Mes informations » et ce qui s'en déduit pendant le rendu. */
export function useInformationsForm(): UseInformationsFormResult {
  const form = useForm<InformationsFormData>({
    ...VOLET_FORM_OPTIONS,
    resolver: zodResolver(informationsSchema),
    defaultValues: {
      civilite: undefined,
      dateNaissance: "",
      nationalite: "",
      nir: "",
      cleNir: "",
      telephone: "",
    },
  });

  const { errors } = form.formState;
  const { requiredFields, ...voletProgress } = useVoletProgress(
    form,
    errors,
    VOLET_ID.INFORMATIONS,
    INFORMATIONS_FIELD_LABEL,
    findRequiredFields,
  );

  // Un littéral plutôt qu'un `Object.fromEntries` casté : une section ajoutée sans compteur ne compile pas.
  const sections: Record<InformationsSection, SectionProgress> = {
    [INFORMATIONS_SECTION.IDENTITE]: computeSectionProgress(
      requiredFields,
      INFORMATIONS_SECTION.IDENTITE,
      errors,
    ),
    [INFORMATIONS_SECTION.CONTACT]: computeSectionProgress(
      requiredFields,
      INFORMATIONS_SECTION.CONTACT,
      errors,
    ),
  };

  return {
    form,
    prefilledValues: PREFILLED_VALUES,
    ...voletProgress,
    sections,
  };
}
