// Récapitulatif des réponses : reconstruit, dans l'ordre du parcours réellement
// emprunté, la liste (question → réponse lisible). S'appuie sur `walkFlow` pour
// ignorer les réponses orphelines d'une branche abandonnée.

import { walkFlow } from "@/questionnaire/domain/flow";
import { findQuestion } from "@/questionnaire/domain/questions";
import type { Answers } from "@/questionnaire/domain/types";

export interface RecapEntry {
  questionId: string;
  question: string;
  answer: string;
}

function answerText(
  fieldName: string,
  options: { value: string; label: string }[],
  value: unknown,
): string {
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
    const field = question?.fields[0];
    if (!question || !field || field.type === "city") return [];
    return [
      {
        questionId: id,
        question: question.title,
        answer: answerText(field.name, field.options, answers[field.name]),
      },
    ];
  });
}
