import { isFieldVisible } from "./conditions";
import { currentMonth, isMonthAfter, parseMonth } from "./month";
import { isRegionCode } from "./regions";
import type { Answers, Field, NumberField, Question } from "./types";

/** Bornes par défaut d'un champ numérique (Q5 : deux caractères). */
const NUMBER_MIN = 0;
const NUMBER_MAX = 99;

function isNumberComplete(field: NumberField, value: unknown): boolean {
  // La valeur est stockée telle que saisie : on refuse "" et " 12 " avant de
  // convertir, `Number("")` valant 0.
  if (typeof value !== "string" || !/^\d+$/.test(value)) return false;
  const count = Number(value);
  return count >= (field.min ?? NUMBER_MIN) && count <= (field.max ?? NUMBER_MAX);
}

/** Un champ est "complet" quand sa valeur est renseignée et valide. */
export function isFieldComplete(field: Field, answers: Answers): boolean {
  const value = answers[field.name];
  switch (field.type) {
    case "radio":
      return typeof value === "string" && field.options.some((o) => o.value === value);
    case "checkbox":
      return Array.isArray(value) && value.length > 0;
    case "month": {
      const month = parseMonth(value);
      if (!month) return false;
      if (isMonthAfter(month, currentMonth())) return false; // pas de date future
      return field.minYear === undefined || month.year >= field.minYear;
    }
    case "number":
      return isNumberComplete(field, value);
    case "region":
      return isRegionCode(value);
    case "toggle":
      // Une case à cocher est toujours complète : décochée EST une réponse.
      return true;
  }
}

/** Champs d'une question actuellement posés et obligatoires. */
function requiredFields(question: Question, answers: Answers): Field[] {
  return question.fields
    .filter((field) => isFieldVisible(field, answers))
    .filter((field) => field.required !== false);
}

/**
 * Une question est complète quand tous ses champs VISIBLES et REQUIS sont
 * complets. Les champs masqués par le branchement sont ignorés.
 */
export function isQuestionComplete(question: Question, answers: Answers): boolean {
  return requiredFields(question, answers).every((field) => isFieldComplete(field, answers));
}

/**
 * Champs qui empêchent de continuer, dans l'ordre de l'écran. Un écran peut en
 * porter plusieurs (Q3 en a jusqu'à quatre) : l'erreur se signale donc champ par
 * champ, pas une fois en bas de page.
 */
export function missingFields(question: Question, answers: Answers): Field[] {
  return requiredFields(question, answers).filter((field) => !isFieldComplete(field, answers));
}

/**
 * Message adressé à l'utilisateur pour un champ resté incomplet. Il dit quoi
 * faire, pas ce qui est faux : c'est la seule information utile à ce stade.
 */
export function fieldErrorMessage(field: Field): string {
  switch (field.type) {
    case "radio":
      return "Sélectionnez une réponse.";
    case "checkbox":
      return "Sélectionnez au moins une réponse.";
    case "month":
      return "Indiquez le mois et l'année.";
    case "number":
      return `Indiquez un nombre entre ${field.min ?? NUMBER_MIN} et ${field.max ?? NUMBER_MAX}.`;
    case "region":
      return "Choisissez une région dans la liste.";
    case "toggle":
      // Jamais atteint : une case à cocher est toujours complète.
      return "";
  }
}
