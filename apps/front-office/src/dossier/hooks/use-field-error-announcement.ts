import { useEffect, useRef, useState } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

import { joinAnnouncements } from "@/lib/join-announcements";
import { formatFieldErrorAnnouncement, type FieldErrors } from "../domain/field-error-announcement";
import { formatStatutVoletChange, type VoletProgress } from "../domain/statut-volet";
import { computeVoletProgress, type RequiredFields } from "../domain/volet-progress";

/**
 * Texte de la région `role="status"` du formulaire : l'erreur du champ qu'on vient de quitter,
 * suivie du statut du volet quand il a changé depuis la dernière annonce.
 * Une soumission n'est pas annoncée ici, c'est le résumé d'erreurs focalisé qui la porte.
 *
 * `labels`, `voletLabel` et `findRequiredFields` sont définis hors du rendu : sans quoi
 * l'abonnement est refait à chaque rendu.
 */
export function useFieldErrorAnnouncement<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  labels: Partial<Record<FieldPath<TFieldValues>, string>>,
  voletLabel: string,
  findRequiredFields: (values: TFieldValues) => RequiredFields,
): string {
  const [announcement, setAnnouncement] = useState("");
  // Lu à la sortie du champ, pas pendant la frappe : le statut change à chaque caractère.
  const lastProgress = useRef<VoletProgress | undefined>(undefined);

  useEffect(
    () =>
      form.subscribe({
        // `touchedFields` en plus : un champ valide quitté pour la première fois ne change pas
        // `errors`, et le statut, lui, change.
        formState: { errors: true, touchedFields: true },
        // Avec `VOLET_FORM_OPTIONS`, validé à `onBlur`, un nom de champ signale sa sortie ;
        // une soumission n'en porte pas.
        callback: ({ name, errors }) => {
          if (!name) return;
          const fieldErrors = (errors ?? {}) as FieldErrors;
          const progress = computeVoletProgress(findRequiredFields(form.getValues()), fieldErrors);
          const statutChange = formatStatutVoletChange(voletLabel, lastProgress.current, progress);
          lastProgress.current = progress;
          setAnnouncement(
            joinAnnouncements(
              formatFieldErrorAnnouncement(name, fieldErrors, labels),
              statutChange,
            ),
          );
        },
      }),
    [form, labels, voletLabel, findRequiredFields],
  );

  return announcement;
}
