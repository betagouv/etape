import { selectPlural, type PluralForms } from "@/lib/plural";
import type { FieldErrors } from "./field-error-announcement";

/** Une erreur du résumé : le champ fautif, par son `id`, et son message. */
export interface VoletError {
  fieldId: string;
  message: string;
}

/** Les erreurs du résumé, dans l'ordre de la page : zod place celles de `superRefine` après celles des champs. */
export function listVoletErrors(
  requiredFields: readonly string[],
  errors: FieldErrors,
): VoletError[] {
  return requiredFields
    .filter((name) => errors[name] !== undefined)
    .map((fieldId) => ({ fieldId, message: errors[fieldId]?.message ?? "" }));
}

const ERROR_NOUNS: PluralForms<string> = {
  one: "erreur",
  other: "erreurs",
};

/** Titre de l'alerte qui liste les erreurs d'un volet. */
export function formatVoletErrorsTitle(errorCount: number): string {
  return `Le formulaire contient ${errorCount} ${selectPlural(errorCount, ERROR_NOUNS)}`;
}
