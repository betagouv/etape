import type { ChangeEvent } from "react";

import { findCaretAfterFormat } from "@/dossier/domain/caret-position";

/**
 * Met en forme la saisie d'un champ sans renvoyer le curseur en fin de champ, et rend la
 * valeur à donner au formulaire : `onChange={(e) => field.onChange(formatInputValue(e, …))}`.
 */
export function formatInputValue(
  event: ChangeEvent<HTMLInputElement>,
  format: (value: string) => string,
  isSignificant: (char: string) => boolean,
): string {
  const input = event.target;
  const formatted = format(input.value);
  if (formatted !== input.value) {
    const caret = findCaretAfterFormat(
      input.value,
      input.selectionStart ?? input.value.length,
      formatted,
      isSignificant,
    );
    // React ne réaffecte pas une valeur déjà en place : le curseur posé ici est gardé.
    input.value = formatted;
    input.setSelectionRange(caret, caret);
  }
  return formatted;
}
