import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type FieldErrors, type UseFormReturn } from "react-hook-form";

import {
  formatStatutVoletAnnouncement,
  type SectionProgress,
  type VoletProgress,
} from "../../domain/statut-volet";
import { VOLET_ID } from "../../domain/volet-id";
import { VOLETS_DOSSIER } from "../../domain/volets-dossier";
import type { VoletError } from "../../domain/volet-errors";
import { useFieldErrorAnnouncement } from "../../hooks/use-field-error-announcement";
import { countFilled, countInvalid, listFilledFields } from "../domain/count-fields";
import {
  INFORMATIONS_FIELD_LABEL,
  INFORMATIONS_SECTION,
  INFORMATIONS_SECTION_FIELDS,
  informationsSchema,
  type InformationsFieldName,
  type InformationsFormData,
  type InformationsSection,
} from "../schema";

export interface UseInformationsFormResult {
  form: UseFormReturn<InformationsFormData>;
  progress: VoletProgress;
  sections: Record<InformationsSection, SectionProgress>;
  voletErrors: VoletError[];
  /** Erreur du champ qu'on vient de quitter et statut du volet, pour la région `role="status"` de l'écran. */
  errorAnnouncement: string;
}

const ALL_REQUIRED_FIELDS = Object.values(INFORMATIONS_SECTION_FIELDS).flat();

const VOLET_LABEL = VOLETS_DOSSIER.find(({ id }) => id === VOLET_ID.INFORMATIONS)?.label ?? "";

function computeProgress(
  filledFields: readonly InformationsFieldName[],
  errors: FieldErrors<InformationsFormData>,
): VoletProgress {
  const filledFieldCount = countFilled(filledFields, ALL_REQUIRED_FIELDS);
  return {
    requiredFieldCount: ALL_REQUIRED_FIELDS.length,
    filledFieldCount,
    remainingFieldCount: ALL_REQUIRED_FIELDS.length - filledFieldCount,
    errorCount: Object.keys(errors).length,
  };
}

function describeVoletStatut(
  values: InformationsFormData,
  errors: FieldErrors<InformationsFormData>,
): string {
  return formatStatutVoletAnnouncement(
    VOLET_LABEL,
    computeProgress(listFilledFields(values, ALL_REQUIRED_FIELDS), errors),
  );
}

/**
 * Le formulaire « Mes informations » et ce qui s'en déduit pendant le rendu : avancement
 * du volet, compteurs par section, erreurs pour le résumé. Rien n'est recopié dans un état.
 */
export function useInformationsForm(): UseInformationsFormResult {
  const form = useForm<InformationsFormData>({
    resolver: zodResolver(informationsSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      civilite: undefined,
      dateNaissance: "",
      nationalite: "",
      nir: "",
      cleNir: "",
      telephone: "",
    },
    // Le focus revient au résumé d'erreurs de l'écran, pas au premier champ fautif.
    shouldFocusError: false,
  });

  const errorAnnouncement = useFieldErrorAnnouncement(
    form,
    INFORMATIONS_FIELD_LABEL,
    describeVoletStatut,
  );
  // Le formulaire vit dans `DossierScreen` : surveiller les valeurs elles-mêmes re-rendrait
  // tout le dossier à chaque frappe ; la liste des champs remplis ne change que de vide à rempli.
  const filledFields = useWatch({
    control: form.control,
    compute: (values) => listFilledFields(values, ALL_REQUIRED_FIELDS),
  });
  const { errors } = form.formState;

  const computeSectionProgress = (section: InformationsSection): SectionProgress => {
    const fields = INFORMATIONS_SECTION_FIELDS[section];
    return {
      remainingFieldCount: fields.length - countFilled(filledFields, fields),
      errorCount: countInvalid(errors, fields),
    };
  };

  // Un littéral plutôt qu'un `Object.fromEntries` casté : une section ajoutée sans compteur ne compile pas.
  const sections: Record<InformationsSection, SectionProgress> = {
    [INFORMATIONS_SECTION.IDENTITE]: computeSectionProgress(INFORMATIONS_SECTION.IDENTITE),
    [INFORMATIONS_SECTION.CONTACT]: computeSectionProgress(INFORMATIONS_SECTION.CONTACT),
  };

  const voletErrors: VoletError[] = Object.entries(errors).map(([fieldId, error]) => ({
    fieldId,
    message: error?.message ?? "",
  }));

  return {
    form,
    progress: computeProgress(filledFields, errors),
    sections,
    voletErrors,
    errorAnnouncement,
  };
}
