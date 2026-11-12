import { useWatch, type FieldPath, type FieldValues, type UseFormReturn } from "react-hook-form";

import type { FieldErrors } from "../domain/field-error-announcement";
import type { VoletProgress } from "../domain/statut-volet";
import type { VoletId } from "../domain/volet-id";
import { computeVoletProgress, type RequiredFields } from "../domain/volet-progress";
import { findVoletLabel } from "../domain/volets-dossier";
import { listVoletErrors, type VoletError } from "../domain/volet-errors";
import { useFieldErrorAnnouncement } from "./use-field-error-announcement";

/** Ce qui se déduit du formulaire d'un volet pour l'écran. */
export interface UseVoletProgressResult<TSection extends string> {
  /** Les champs exigés et remplis : chaque volet en tire ses compteurs par section. */
  requiredFields: RequiredFields<TSection>;
  progress: VoletProgress;
  voletErrors: VoletError[];
  /** Erreur du champ qu'on vient de quitter et statut du volet, pour la région `role="status"` de l'écran. */
  errorAnnouncement: string;
}

/**
 * Avancement du volet, erreurs pour le résumé et annonce d'erreur, déduits du formulaire
 * pendant le rendu : rien n'est recopié dans un état. Les compteurs par section restent à
 * chaque volet, qui seul connaît ses sections.
 *
 * `errors` est `form.formState.errors`, passé à part : lu ici, son type générique ne se réduit
 * pas au type du domaine sans cast, alors que celui de chaque volet s'y conforme.
 *
 * `labels` et `findRequiredFields` sont définis hors du rendu : sans quoi l'abonnement de
 * l'annonce est refait à chaque rendu.
 */
export function useVoletProgress<TFieldValues extends FieldValues, TSection extends string>(
  form: UseFormReturn<TFieldValues>,
  errors: FieldErrors,
  voletId: VoletId,
  labels: Partial<Record<FieldPath<TFieldValues>, string>>,
  findRequiredFields: (values: TFieldValues) => RequiredFields<TSection>,
): UseVoletProgressResult<TSection> {
  const errorAnnouncement = useFieldErrorAnnouncement(
    form,
    labels,
    findVoletLabel(voletId),
    findRequiredFields,
  );
  // Le formulaire vit dans `DossierScreen` : surveiller les valeurs elles-mêmes re-rendrait
  // tout le dossier à chaque frappe ; les champs exigés ne changent qu'avec les réponses qui
  // en décident, les champs remplis qu'au passage de vide à rempli.
  const requiredFields = useWatch({ control: form.control, compute: findRequiredFields });

  return {
    requiredFields,
    progress: computeVoletProgress(requiredFields.allFields, requiredFields.filledFields, errors),
    voletErrors: listVoletErrors(requiredFields.allFields, errors),
    errorAnnouncement,
  };
}
