import { isFieldVisible } from "./conditions";
import {
  MONTH_PROBLEM,
  monthEntryProblem,
  oldestAcceptedYear,
  readMonthEntry,
  type MonthProblem,
} from "./month";
import { isRegionCode } from "./regions";
import type { Answers, AnswerValue, Field, MonthField, NumberField, Question } from "./types";

/** Bornes par défaut d'un champ numérique (Q5 : deux caractères). */
const NUMBER_MIN = 0;
const NUMBER_MAX = 99;

/** MANQUANTE : signalée au clic sur « Continuer » seulement. INVALIDE : dès la sortie du champ. */
export const ISSUE_KIND = {
  MISSING: "missing",
  INVALID: "invalid",
} as const;

export type IssueKind = (typeof ISSUE_KIND)[keyof typeof ISSUE_KIND];

export interface FieldIssue {
  kind: IssueKind;
  /** Message adressé à l'utilisateur : le constat, puis ce qu'il faut faire. */
  message: string;
}

const FUTURE_DATE_MESSAGE =
  "Cette date est dans le futur : indiquez le mois en cours ou un mois passé.";

const MONTH_PROBLEM_MESSAGES: Record<
  Exclude<MonthProblem, typeof MONTH_PROBLEM.INCOMPLETE>,
  (minYear: number) => string
> = {
  [MONTH_PROBLEM.MONTH_OUT_OF_RANGE]: () => "Le mois doit être compris entre 01 et 12.",
  [MONTH_PROBLEM.YEAR_TOO_OLD]: (minYear) => `L'année doit être ${minYear} ou postérieure.`,
  [MONTH_PROBLEM.FUTURE_YEAR]: () => FUTURE_DATE_MESSAGE,
  [MONTH_PROBLEM.FUTURE_MONTH]: () => FUTURE_DATE_MESSAGE,
};

function monthIssue(field: MonthField, value: AnswerValue | undefined): FieldIssue | null {
  const minYear = field.minYear ?? oldestAcceptedYear();
  const problem = monthEntryProblem(readMonthEntry(value), minYear);
  if (problem === null) return null;
  if (problem === MONTH_PROBLEM.INCOMPLETE) return missing(field);
  return { kind: ISSUE_KIND.INVALID, message: MONTH_PROBLEM_MESSAGES[problem](minYear) };
}

function numberIssue(field: NumberField, value: AnswerValue | undefined): FieldIssue | null {
  // La valeur est stockée telle que saisie : on refuse "" et " 12 " avant de
  // convertir, `Number("")` valant 0.
  if (typeof value !== "string" || !/^\d+$/.test(value)) return missing(field);
  const min = field.min ?? NUMBER_MIN;
  const max = field.max ?? NUMBER_MAX;
  const count = Number(value);
  if (count >= min && count <= max) return null;
  const unit = field.suffix ? ` ${field.suffix}` : "";
  return {
    kind: ISSUE_KIND.INVALID,
    message: `La valeur doit être comprise entre ${min} et ${max}${unit}.`,
  };
}

function regionIssue(field: Field, value: AnswerValue | undefined): FieldIssue | null {
  if (isRegionCode(value)) return null;
  if (typeof value !== "string" || value.trim() === "") return missing(field);
  return {
    kind: ISSUE_KIND.INVALID,
    message: `« ${value.trim()} » ne correspond à aucune région : choisissez-en une dans la liste.`,
  };
}

/**
 * Message d'une réponse absente. Il se suffit à lui-même — sur un écran à champ
 * unique, il s'affiche seul en bas, détaché du champ qu'il concerne.
 */
const MISSING_MESSAGES: Record<Field["type"], string> = {
  radio: "Aucune réponse sélectionnée : choisissez une option pour continuer.",
  checkbox: "Aucune réponse sélectionnée : cochez au moins une option pour continuer.",
  month: "Date incomplète : indiquez l'année et le mois pour continuer.",
  number: "Aucune valeur saisie : indiquez un nombre pour continuer.",
  region: "Aucune région sélectionnée : choisissez-la dans la liste pour continuer.",
  // Jamais atteint.
  toggle: "",
};

function missing(field: Field): FieldIssue {
  return { kind: ISSUE_KIND.MISSING, message: MISSING_MESSAGES[field.type] };
}

/** Problème propre à la valeur du champ, hors cohérence avec les autres réponses. */
function valueIssue(field: Field, answers: Answers): FieldIssue | null {
  const value = answers[field.name];
  switch (field.type) {
    case "radio":
      return typeof value === "string" && field.options.some((o) => o.value === value)
        ? null
        : missing(field);
    case "checkbox":
      return Array.isArray(value) && value.length > 0 ? null : missing(field);
    case "month":
      return monthIssue(field, value);
    case "number":
      return numberIssue(field, value);
    case "region":
      return regionIssue(field, value);
    case "toggle":
      // Une case à cocher est toujours complète : décochée EST une réponse.
      return null;
  }
}

/**
 * Un problème par champ, dans l'ordre d'affichage : valeur absente ou impossible
 * d'abord, puis cohérence ; un champ facultatif vide n'en a pas.
 */
export function fieldIssues(question: Question, answers: Answers): Map<string, FieldIssue> {
  const issues = new Map<string, FieldIssue>();

  for (const field of question.fields.filter((field) => isFieldVisible(field, answers))) {
    const issue = valueIssue(field, answers);
    if (issue) {
      if (issue.kind === ISSUE_KIND.INVALID || field.required !== false) {
        issues.set(field.name, issue);
      }
      continue;
    }
    const incoherence = field.coherence?.(answers);
    if (incoherence) issues.set(field.name, { kind: ISSUE_KIND.INVALID, message: incoherence });
  }
  return issues;
}

export function isQuestionComplete(question: Question, answers: Answers): boolean {
  return fieldIssues(question, answers).size === 0;
}
