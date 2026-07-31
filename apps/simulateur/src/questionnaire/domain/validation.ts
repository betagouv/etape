import { isFieldVisible } from "./conditions";
import type { Answers, Field, Question } from "./types";

/** Un champ est "complet" quand sa valeur est renseignée et valide. */
export function isFieldComplete(field: Field, answers: Answers): boolean {
  const value = answers[field.name];
  switch (field.type) {
    case "radio":
      return typeof value === "string" && field.options.some((o) => o.value === value);
    case "city":
      return (
        typeof value === "object" &&
        value !== null &&
        "code" in value &&
        Boolean((value as { code?: string }).code)
      );
    case "checkbox":
      return Array.isArray(value) && value.length > 0;
  }
}

/**
 * Une question est complète quand tous ses champs VISIBLES et REQUIS sont
 * complets. Les champs masqués par le branchement sont ignorés.
 */
export function isQuestionComplete(question: Question, answers: Answers): boolean {
  return question.fields
    .filter((field) => isFieldVisible(field, answers))
    .filter((field) => field.required !== false)
    .every((field) => isFieldComplete(field, answers));
}
