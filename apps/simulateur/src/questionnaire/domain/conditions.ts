import type { Answers, Field } from "./types";

/** Un champ est visible s'il n'a pas de condition, ou si sa condition passe. */
export function isFieldVisible(field: Field, answers: Answers): boolean {
  return field.visibleWhen ? field.visibleWhen(answers) : true;
}
