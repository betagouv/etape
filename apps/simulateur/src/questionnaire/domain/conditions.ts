import type { Answers, Field } from "./types";

/** Un champ est visible s'il n'a pas de condition, ou si sa condition passe. */
export function isFieldVisible(field: Field, answers: Answers): boolean {
  return field.visibleWhen ? field.visibleWhen(answers) : true;
}

/**
 * Ce champ est-il une précision ouverte par cette option du champ principal ?
 * `sub` accepte une liste quand la même précision se pose sous plusieurs
 * options (l'arrêt de travail, sous salarié·e, agent·e et indépendant·e).
 */
export function opensUnder(field: Field, optionValue: string): boolean {
  if (field.sub === undefined) return false;
  return Array.isArray(field.sub) ? field.sub.includes(optionValue) : field.sub === optionValue;
}
