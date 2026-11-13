import { useEffect, useRef, useState } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

import { formatFieldErrorAnnouncement, type FieldErrors } from "../domain/field-error-announcement";
import { describeVoletStatut, type RequiredFields } from "../domain/volet-progress";

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
  const lastStatut = useRef("");

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
          const statut = describeVoletStatut(
            voletLabel,
            findRequiredFields(form.getValues()),
            fieldErrors,
          );
          const hasStatutChanged = statut !== lastStatut.current;
          lastStatut.current = statut;
          setAnnouncement(
            [
              formatFieldErrorAnnouncement(name, fieldErrors, labels),
              hasStatutChanged ? statut : "",
            ]
              .filter(Boolean)
              .join(" "),
          );
        },
      }),
    [form, labels, voletLabel, findRequiredFields],
  );

  return announcement;
}
