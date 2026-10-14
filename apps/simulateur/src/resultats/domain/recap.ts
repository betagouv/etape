// Récapitulatif des réponses : reconstruit, dans l'ordre du parcours réellement
// emprunté, la liste (question → réponse lisible). S'appuie sur `walkFlow` pour
// ignorer les réponses orphelines d'une branche abandonnée.
//
// TOUS les champs posés y figurent, pas seulement ceux à options : l'ancienneté
// (Q4) et la durée d'activité (Q5) décident du PTP et de la Démission-
// Reconversion, les taire priverait la personne du moyen de les corriger.

import { isFieldVisible } from "@/questionnaire/domain/conditions";
import { walkFlow } from "@/questionnaire/domain/flow";
import { monthLabel, parseMonth } from "@/questionnaire/domain/month";
import { findQuestion } from "@/questionnaire/domain/questions";
import { regionName } from "@/questionnaire/domain/regions";
import type { Answers, AnswerValue, Field, Option } from "@/questionnaire/domain/types";

export interface RecapEntry {
  questionId: string;
  /** Champ d'origine : rend l'entrée unique quand une question en porte plusieurs. */
  fieldName: string;
  question: string;
  answer: string;
}

function optionText(options: Option[], value: AnswerValue | undefined): string {
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

/** Réponse telle qu'elle se lit — vide quand le champ n'a pas été renseigné. */
export function answerText(field: Field, value: AnswerValue | undefined): string {
  switch (field.type) {
    case "radio":
    case "checkbox":
      return optionText(field.options, value);
    case "month": {
      const month = parseMonth(value);
      return month ? monthLabel(month) : "";
    }
    case "number": {
      if (typeof value !== "string" || value === "") return "";
      return field.suffix ? `${value} ${field.suffix}` : value;
    }
    case "region":
      return typeof value === "string" ? (regionName(value) ?? "") : "";
    case "toggle":
      // Une case qui répond à la place d'un autre champ ne se lit que cochée.
      if (field.summary !== undefined) return value === true ? field.summary : "";
      // Décochée EST une réponse : la taire laisserait croire à un oubli.
      return value === true ? "Oui" : "Non";
  }
}

export function buildRecap(answers: Answers): RecapEntry[] {
  return walkFlow(answers).path.flatMap((id) => {
    const question = findQuestion(id);
    if (!question) return [];
    const answered = question.fields
      .filter((field) => isFieldVisible(field, answers))
      .map((field) => ({ field, answer: answerText(field, answers[field.name]) }))
      .filter((entry) => entry.answer !== "");
    // Le libellé du champ quand la question donne plusieurs réponses (Q3, Q6) :
    // le titre les confondrait. Une réponse seule se lit sous le titre (Q5,
    // « Nombre d'années » ou « Moins d'un an »).
    const several = answered.length > 1;
    return answered.map(({ field, answer }) => ({
      questionId: id,
      fieldName: field.name,
      question: several ? (field.label ?? question.title) : question.title,
      answer,
    }));
  });
}
