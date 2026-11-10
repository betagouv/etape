import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

import type { FieldErrors } from "../../domain/field-error-announcement";
import {
  formatStatutVoletAnnouncement,
  type SectionProgress,
  type VoletProgress,
} from "../../domain/statut-volet";
import { VOLET_ID } from "../../domain/volet-id";
import { VOLETS_DOSSIER } from "../../domain/volets-dossier";
import type { VoletError } from "../../domain/volet-errors";
import { useFieldErrorAnnouncement } from "../../hooks/use-field-error-announcement";
import { countFilled, countInvalid } from "../domain/count-fields";
import { findRequiredFields, type RequiredFields } from "../domain/required-fields";
import {
  EMPLOYEUR_ENTRY_MODE,
  SITUATION_PROFESSIONNELLE_FIELD_LABEL,
  SITUATION_PROFESSIONNELLE_SECTION,
  situationProfessionnelleSchema,
  type SituationProfessionnelleFormData,
  type SituationProfessionnelleSection,
} from "../schema";

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

function computeProgress(
  { allFields, filledFields }: RequiredFields,
  errors: FieldErrors,
): VoletProgress {
  const filledFieldCount = countFilled(filledFields, allFields);
  return {
    requiredFieldCount: allFields.length,
    filledFieldCount,
    remainingFieldCount: allFields.length - filledFieldCount,
    errorCount: countInvalid(errors, allFields),
  };
}

function describeVoletStatut(
  values: SituationProfessionnelleFormData,
  errors: FieldErrors,
): string {
  return formatStatutVoletAnnouncement(
    VOLET_LABEL,
    computeProgress(findRequiredFields(values), errors),
  );
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
      demission: undefined,
      dateDemission: "",
    },
    // Le focus revient au résumé d'erreurs de l'écran, pas au premier champ fautif.
    shouldFocusError: false,
  });

  const errorAnnouncement = useFieldErrorAnnouncement(
    form,
    SITUATION_PROFESSIONNELLE_FIELD_LABEL,
    describeVoletStatut,
  );
  // Le formulaire vit dans `DossierScreen` : surveiller les valeurs elles-mêmes re-rendrait
  // tout le dossier à chaque frappe ; les champs exigés ne changent qu'avec le mode de saisie
  // et la réponse sur la démission, les champs remplis qu'au passage de vide à rempli.
  const requiredFields = useWatch({ control: form.control, compute: findRequiredFields });
  const { errors } = form.formState;

  const computeSectionProgress = (section: SituationProfessionnelleSection): SectionProgress => {
    const fields = requiredFields.sectionFields[section];
    return {
      remainingFieldCount: fields.length - countFilled(requiredFields.filledFields, fields),
      errorCount: countInvalid(errors, fields),
    };
  };

  // Un littéral plutôt qu'un `Object.fromEntries` casté : une section ajoutée sans compteur ne compile pas.
  const sections: Record<SituationProfessionnelleSection, SectionProgress> = {
    [SITUATION_PROFESSIONNELLE_SECTION.EMPLOI]: computeSectionProgress(
      SITUATION_PROFESSIONNELLE_SECTION.EMPLOI,
    ),
    [SITUATION_PROFESSIONNELLE_SECTION.DEMISSION]: computeSectionProgress(
      SITUATION_PROFESSIONNELLE_SECTION.DEMISSION,
    ),
  };

  // Dans l'ordre de la page : zod place les erreurs de `superRefine` après celles des champs.
  const voletErrors: VoletError[] = requiredFields.allFields
    .filter((name) => errors[name] !== undefined)
    .map((fieldId) => ({ fieldId, message: errors[fieldId]?.message ?? "" }));

  return {
    form,
    progress: computeProgress(requiredFields, errors),
    sections,
    voletErrors,
    errorAnnouncement,
  };
}
