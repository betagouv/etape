import type { ChangeEvent } from "react";

import { findCaretAfterFormat } from "@/dossier/domain/caret-position";
import {
  deleteAcrossSeparator,
  DELETION_DIRECTION,
  type DeletionDirection,
  type ValueWithCaret,
} from "@/dossier/domain/separator-deletion";

/** Les `inputType` de Suppr et de Retour arrière ; un mot ou une ligne effacés d'un coup n'en sont pas. */
const DELETION_DIRECTION_BY_INPUT_TYPE: Partial<Record<string, DeletionDirection>> = {
  deleteContentForward: DELETION_DIRECTION.FORWARD,
  deleteContentBackward: DELETION_DIRECTION.BACKWARD,
};

function findDeletionDirection(event: Event): DeletionDirection | undefined {
  return event instanceof InputEvent
    ? DELETION_DIRECTION_BY_INPUT_TYPE[event.inputType]
    : undefined;
}

/**
 * Met en forme la saisie d'un champ sans renvoyer le curseur en fin de champ, et rend la valeur
 * à donner au formulaire :
 * `onChange={(e) => field.onChange(formatInputValue(e, field.value, …))}`.
 */
export function formatInputValue(
  event: ChangeEvent<HTMLInputElement>,
  previousValue: string,
  format: (value: string) => string,
  isSignificant: (char: string) => boolean,
): string {
  const input = event.target;
  let edit: ValueWithCaret = {
    value: input.value,
    caret: input.selectionStart ?? input.value.length,
  };

  const direction = findDeletionDirection(event.nativeEvent);
  // La touche n'a effacé qu'un séparateur, que la mise en forme remettrait : sans cela, elle ne ferait rien.
  if (direction !== undefined && format(edit.value) === previousValue) {
    edit = deleteAcrossSeparator(edit.value, edit.caret, direction, isSignificant);
  }

  const formatted = format(edit.value);
  if (formatted !== input.value) {
    const caret = findCaretAfterFormat(edit.value, edit.caret, formatted, isSignificant);
    // React ne réaffecte pas une valeur déjà en place : le curseur posé ici est gardé.
    input.value = formatted;
    input.setSelectionRange(caret, caret);
  }
  return formatted;
}
