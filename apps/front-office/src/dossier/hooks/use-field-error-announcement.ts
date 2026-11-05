import { useEffect, useState } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

import { formatFieldErrorAnnouncement, type FieldErrors } from "../domain/field-error-announcement";

/**
 * Texte de la région `role="status"` du formulaire : l'erreur du champ qu'on vient de quitter.
 * Une soumission n'est pas annoncée ici, c'est le résumé d'erreurs focalisé qui la porte.
 */
export function useFieldErrorAnnouncement<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  labels: Partial<Record<FieldPath<TFieldValues>, string>>,
): string {
  const [announcement, setAnnouncement] = useState("");

  useEffect(
    () =>
      form.subscribe({
        formState: { errors: true },
        // Avec `mode` et `reValidateMode` à `onBlur`, un nom de champ signale sa sortie ;
        // une soumission n'en porte pas.
        callback: ({ name, errors }) => {
          if (!name) return;
          setAnnouncement(
            formatFieldErrorAnnouncement(name, (errors ?? {}) as FieldErrors, labels),
          );
        },
      }),
    [form, labels],
  );

  return announcement;
}
