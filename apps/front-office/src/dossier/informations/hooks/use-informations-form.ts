import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type FieldErrors, type UseFormReturn } from "react-hook-form";

import { formatStatutVoletAnnouncement, type VoletProgress } from "../../domain/statut-volet";
import { VOLET_ID } from "../../domain/volet-id";
import { VOLETS_DOSSIER } from "../../domain/volets-dossier";
import type { VoletError } from "../../domain/volet-errors";
import { useFieldErrorAnnouncement } from "../../hooks/use-field-error-announcement";
import { countFilled, countInvalid } from "../domain/count-fields";
import {
  INFORMATIONS_FIELD_LABEL,
  INFORMATIONS_SECTION_FIELDS,
  informationsSchema,
  type InformationsFormData,
  type InformationsSection,
} from "../schema";

export interface SectionProgress {
  remainingFieldCount: number;
  errorCount: number;
}

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
  values: Partial<InformationsFormData>,
  errors: FieldErrors<InformationsFormData>,
): VoletProgress {
  const filledFieldCount = countFilled(values, ALL_REQUIRED_FIELDS);
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
  return formatStatutVoletAnnouncement(VOLET_LABEL, computeProgress(values, errors));
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
  const values = useWatch({ control: form.control });
  const { errors } = form.formState;

  const sections = Object.fromEntries(
    Object.entries(INFORMATIONS_SECTION_FIELDS).map(([section, fields]) => [
      section,
      {
        remainingFieldCount: fields.length - countFilled(values, fields),
        errorCount: countInvalid(errors, fields),
      },
    ]),
  ) as Record<InformationsSection, SectionProgress>;

  const voletErrors: VoletError[] = Object.entries(errors).map(([fieldId, error]) => ({
    fieldId,
    message: error?.message ?? "",
  }));

  return {
    form,
    progress: computeProgress(values, errors),
    sections,
    voletErrors,
    errorAnnouncement,
  };
}
