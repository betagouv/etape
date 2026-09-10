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
 * Une question est complète quand rien sur l'écran n'empêche de continuer :
 * ni réponse manquante, ni incohérence avec une réponse antérieure.
 */
export function isQuestionComplete(question: Question, answers: Answers): boolean {
  return fieldErrors(question, answers).size === 0;
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
 * Ce qui bloque sur cet écran, par nom de champ et dans l'ordre d'affichage :
 * les réponses manquantes, puis les réponses valides mais incohérentes avec le
 * reste du parcours (`Field.coherence`).
 *
 * Un champ ne porte qu'un message : tant qu'il est vide, c'est son absence
 * qu'on signale — un contrôle de cohérence sur une valeur absente n'aurait rien
 * à comparer.
 */
export function fieldErrors(question: Question, answers: Answers): Map<string, string> {
  const errors = new Map<string, string>();

  for (const field of question.fields.filter((field) => isFieldVisible(field, answers))) {
    if (!isFieldComplete(field, answers)) {
      if (field.required !== false) errors.set(field.name, fieldErrorMessage(field));
      continue;
    }
    const incoherence = field.coherence?.(answers);
    if (incoherence) errors.set(field.name, incoherence);
  }
  return errors;
}

/**
 * Message adressé à l'utilisateur pour un champ resté incomplet.
 *
 * Forme unique : le constat, puis l'action à faire pour continuer. Le message
 * se suffit à lui-même — sur un écran à champ unique, il s'affiche seul en bas,
 * détaché du champ qu'il concerne.
 */
export function fieldErrorMessage(field: Field): string {
  switch (field.type) {
    case "radio":
      return "Aucune réponse sélectionnée : choisissez une option pour continuer.";
    case "checkbox":
      return "Aucune réponse sélectionnée : cochez au moins une option pour continuer.";
    case "month":
      return "Date incomplète : indiquez le mois et l'année pour continuer.";
    case "number":
      return `Aucune valeur saisie : indiquez un nombre entre ${field.min ?? NUMBER_MIN} et ${field.max ?? NUMBER_MAX} pour continuer.`;
    case "region":
      return "Aucune région sélectionnée : choisissez-la dans la liste pour continuer.";
    case "toggle":
      // Jamais atteint : une case à cocher est toujours complète.
      return "";
  }
}
