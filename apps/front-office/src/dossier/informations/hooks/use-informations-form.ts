import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

import type { VoletProgress } from "../../domain/statut-volet";
import type { VoletError } from "../../domain/volet-errors";
import { useFieldErrorAnnouncement } from "../../hooks/use-field-error-announcement";
import { countFilled, countInvalid } from "../domain/count-fields";
import {
  INFORMATIONS_FIELD_LABEL,
  INFORMATIONS_SECTION_FIELDS,
  informationsSchema,
  type Civilite,
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
  /** Erreur du champ qu'on vient de quitter, pour la région `role="status"` de l'écran. */
  errorAnnouncement: string;
}

const ALL_REQUIRED_FIELDS = Object.values(INFORMATIONS_SECTION_FIELDS).flat();

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
      civilite: "" as Civilite,
      dateNaissance: "",
      nationalite: "",
      nir: "",
      cleNir: "",
      telephone: "",
    },
    // Le focus revient au résumé d'erreurs de l'écran, pas au premier champ fautif.
    shouldFocusError: false,
  });

  const errorAnnouncement = useFieldErrorAnnouncement(form, INFORMATIONS_FIELD_LABEL);
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

  const filledFieldCount = countFilled(values, ALL_REQUIRED_FIELDS);

  const voletErrors: VoletError[] = Object.entries(errors).map(([fieldId, error]) => ({
    fieldId,
    message: error?.message ?? "",
  }));

  return {
    form,
    progress: {
      requiredFieldCount: ALL_REQUIRED_FIELDS.length,
      filledFieldCount,
      remainingFieldCount: ALL_REQUIRED_FIELDS.length - filledFieldCount,
      errorCount: voletErrors.length,
    },
    sections,
    voletErrors,
    errorAnnouncement,
  };
}
