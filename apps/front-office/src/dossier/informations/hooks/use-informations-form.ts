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
  INFORMATIONS_FIELD_LABEL,
  INFORMATIONS_SECTION,
  informationsSchema,
  type InformationsFormData,
  type InformationsSection,
} from "../schema";

export interface InformationsPrefilledValues {
  nom: string;
  prenom: string;
  email: string;
  adresse: string;
}

export interface UseInformationsFormResult {
  form: UseFormReturn<InformationsFormData>;
  /** Repris de l'inscription et du profil : affichés, jamais saisis ici. */
  prefilledValues: InformationsPrefilledValues;
  progress: VoletProgress;
  sections: Record<InformationsSection, SectionProgress>;
  voletErrors: VoletError[];
  /** Erreur du champ qu'on vient de quitter et statut du volet, pour la région `role="status"` de l'écran. */
  errorAnnouncement: string;
}

// Nom, prénom, e-mail, adresse : en attendant l'API.
const PREFILLED_VALUES: InformationsPrefilledValues = {
  nom: "",
  prenom: "",
  email: "",
  adresse: "",
};

const VOLET_LABEL = VOLETS_DOSSIER.find(({ id }) => id === VOLET_ID.INFORMATIONS)?.label ?? "";

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
    VOLET_LABEL,
    findRequiredFields,
  );
  // Le formulaire vit dans `DossierScreen` : surveiller les valeurs elles-mêmes re-rendrait
  // tout le dossier à chaque frappe ; les champs remplis ne changent qu'au passage de vide à rempli.
  const requiredFields = useWatch({ control: form.control, compute: findRequiredFields });
  const { errors } = form.formState;

  const findSectionProgress = (section: InformationsSection): SectionProgress =>
    computeSectionProgress(
      requiredFields.sectionFields[section],
      requiredFields.filledFields,
      errors,
    );

  // Un littéral plutôt qu'un `Object.fromEntries` casté : une section ajoutée sans compteur ne compile pas.
  const sections: Record<InformationsSection, SectionProgress> = {
    [INFORMATIONS_SECTION.IDENTITE]: findSectionProgress(INFORMATIONS_SECTION.IDENTITE),
    [INFORMATIONS_SECTION.CONTACT]: findSectionProgress(INFORMATIONS_SECTION.CONTACT),
  };

  return {
    form,
    prefilledValues: PREFILLED_VALUES,
    progress: computeVoletProgress(requiredFields.allFields, requiredFields.filledFields, errors),
    sections,
    voletErrors: listVoletErrors(requiredFields.allFields, errors),
    errorAnnouncement,
  };
}
