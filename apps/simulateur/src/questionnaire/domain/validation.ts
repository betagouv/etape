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

/**
 * Deux natures de problème, qui ne s'affichent pas au même moment ni sous la
 * même forme :
 * - une réponse MANQUANTE ne se signale qu'au clic sur « Continuer » — la
 *   signaler plus tôt reprocherait à la personne de ne pas avoir encore
 *   répondu ;
 * - une réponse INVALIDE (mois 13, plus de 50 ans, durée inférieure à
 *   l'ancienneté) se signale dès la sortie du champ : elle est là, mais fausse.
 */
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

const MONTH_PROBLEM_MESSAGES: Record<
  Exclude<MonthProblem, typeof MONTH_PROBLEM.INCOMPLETE>,
  (minYear: number) => string
> = {
  [MONTH_PROBLEM.MONTH_OUT_OF_RANGE]: () => "Le mois doit être compris entre 01 et 12.",
  [MONTH_PROBLEM.YEAR_TOO_OLD]: (minYear) => `L'année doit être ${minYear} ou postérieure.`,
  [MONTH_PROBLEM.FUTURE_YEAR]: () =>
    "Cette date est dans le futur : indiquez le mois en cours ou un mois passé.",
  [MONTH_PROBLEM.FUTURE_MONTH]: () =>
    "Cette date est dans le futur : indiquez le mois en cours ou un mois passé.",
};

const minYearOf = (field: MonthField): number => field.minYear ?? oldestAcceptedYear();

/**
 * Problème d'un champ de mois. Une partie complète mais impossible rend la
 * saisie INVALIDE même si l'autre partie manque encore (une année future).
 */
function monthIssue(field: MonthField, value: AnswerValue | undefined): FieldIssue | null {
  const minYear = minYearOf(field);
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
  // Jamais atteint : une case à cocher est toujours complète.
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
      return isRegionCode(value) ? null : missing(field);
    case "toggle":
      // Une case à cocher est toujours complète : décochée EST une réponse.
      return null;
  }
}

/**
 * Ce qui empêche de continuer sur cet écran, par nom de champ et dans l'ordre
 * d'affichage. Un écran peut en porter plusieurs (Q3 en a jusqu'à quatre) :
 * l'erreur se signale donc champ par champ, pas une fois en bas de page.
 *
 * Un champ ne porte qu'un problème : tant que sa valeur est absente ou
 * impossible, c'est cela qu'on signale — un contrôle de cohérence n'aurait rien
 * à comparer. Un champ facultatif laissé vide n'en a pas ; rempli, il doit
 * l'être correctement.
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

/**
 * Une question est complète quand rien sur l'écran n'empêche de continuer :
 * ni réponse manquante, ni valeur impossible, ni incohérence avec une réponse
 * antérieure.
 */
export function isQuestionComplete(question: Question, answers: Answers): boolean {
  return fieldIssues(question, answers).size === 0;
}
