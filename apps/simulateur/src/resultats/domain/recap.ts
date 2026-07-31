// Récapitulatif des réponses : reconstruit, dans l'ordre du parcours réellement
// emprunté, la liste (question → réponse lisible). S'appuie sur `walkFlow` pour
// ignorer les réponses orphelines d'une branche abandonnée.

import { isFieldVisible } from "@/questionnaire/domain/conditions";
import { walkFlow } from "@/questionnaire/domain/flow";
import { findQuestion } from "@/questionnaire/domain/questions";
import {
  hasOptions,
  type Answers,
  type AnswerValue,
  type Option,
} from "@/questionnaire/domain/types";

export interface RecapEntry {
  questionId: string;
  /** Champ d'origine : rend l'entrée unique quand une question en porte plusieurs. */
  fieldName: string;
  question: string;
  answer: string;
}

function answerText(options: Option[], value: AnswerValue | undefined): string {
  if (typeof value === "string") {
    return options.find((option) => option.value === value)?.label ?? "";
  }
  if (Array.isArray(value)) {
    return options
      .filter((option) => value.includes(option.value))
      .map((option) => option.label)
      .join(" · ");
  }
  return "";
}

export function buildRecap(answers: Answers): RecapEntry[] {
  return walkFlow(answers).path.flatMap((id) => {
    const question = findQuestion(id);
    if (!question) return [];
    return question.fields
      .filter((field) => isFieldVisible(field, answers))
      .filter(hasOptions)
      .map((field) => ({
        questionId: id,
        fieldName: field.name,
        question: question.title,
        answer: answerText(field.options, answers[field.name]),
      }));
  });
}
