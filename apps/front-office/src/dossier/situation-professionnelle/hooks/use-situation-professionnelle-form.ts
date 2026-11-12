import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

import type { SectionProgress, VoletProgress } from "../../domain/statut-volet";
import { VOLET_ID } from "../../domain/volet-id";
import { computeSectionProgress, computeVoletProgress } from "../../domain/volet-progress";
import { VOLETS_DOSSIER } from "../../domain/volets-dossier";
import { listVoletErrors, type VoletError } from "../../domain/volet-errors";
import { useFieldErrorAnnouncement } from "../../hooks/use-field-error-announcement";
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
export interface UseSituationProfessionnelleFormResult {
  form: UseFormReturn<SituationProfessionnelleFormData>;
  progress: VoletProgress;
  sections: Record<SituationProfessionnelleSection, SectionProgress>;
  voletErrors: VoletError[];
  /** Erreur du champ qu'on vient de quitter et statut du volet, pour la région `role="status"` de l'écran. */
  errorAnnouncement: string;
}

const VOLET_LABEL =
  VOLETS_DOSSIER.find(({ id }) => id === VOLET_ID.SITUATION_PROFESSIONNELLE)?.label ?? "";

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
      demission: undefined,
      dateDemission: "",
    },
    // Le focus revient au résumé d'erreurs de l'écran, pas au premier champ fautif.
    shouldFocusError: false,
  });

  const errorAnnouncement = useFieldErrorAnnouncement(
    form,
    SITUATION_PROFESSIONNELLE_FIELD_LABEL,
    VOLET_LABEL,
    findRequiredFields,
  );
  // Le formulaire vit dans `DossierScreen` : surveiller les valeurs elles-mêmes re-rendrait
  // tout le dossier à chaque frappe ; les champs exigés ne changent qu'avec le mode de saisie
  // et la réponse sur la démission, les champs remplis qu'au passage de vide à rempli.
  const requiredFields = useWatch({ control: form.control, compute: findRequiredFields });
  const { errors } = form.formState;

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
    progress: computeVoletProgress(requiredFields.allFields, requiredFields.filledFields, errors),
    sections,
    voletErrors: listVoletErrors(requiredFields.allFields, errors),
    errorAnnouncement,
  };
}
