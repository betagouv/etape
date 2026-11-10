import type {
  SituationProfessionnelleFieldName,
  SituationProfessionnelleFormData,
} from "../schema";

/** Les champs qui ont une valeur : ne change qu'au passage de vide à rempli, pas à chaque frappe. */
export function listFilledFields(
  values: Partial<SituationProfessionnelleFormData>,
  fields: readonly SituationProfessionnelleFieldName[],
): SituationProfessionnelleFieldName[] {
  // L'employeur choisi est un objet ou `null`, les autres champs des chaînes.
  return fields.filter((name) => {
    const value = values[name];
    return value !== undefined && value !== null && value !== "";
  });
}

/** Nombre de champs demandés parmi les champs remplis. */
export function countFilled(
  filledFields: readonly SituationProfessionnelleFieldName[],
  fields: readonly SituationProfessionnelleFieldName[],
): number {
  return fields.filter((name) => filledFields.includes(name)).length;
}

/** Nombre de champs demandés qui portent une erreur. */
export function countInvalid(
  errors: Partial<Record<SituationProfessionnelleFieldName, unknown>>,
  fields: readonly SituationProfessionnelleFieldName[],
): number {
  return fields.filter((name) => errors[name] !== undefined).length;
}
