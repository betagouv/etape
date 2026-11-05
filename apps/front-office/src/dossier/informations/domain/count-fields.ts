import type { InformationsFieldName, InformationsFormData } from "../schema";

/** Les champs qui ont une valeur : ne change qu'au passage de vide à rempli, pas à chaque frappe. */
export function listFilledFields(
  values: Partial<InformationsFormData>,
  fields: readonly InformationsFieldName[],
): InformationsFieldName[] {
  return fields.filter((name) => {
    const value = values[name];
    return typeof value === "string" && value.length > 0;
  });
}

export function countFilled(
  filledFields: readonly InformationsFieldName[],
  fields: readonly InformationsFieldName[],
): number {
  return fields.filter((name) => filledFields.includes(name)).length;
}

export function countInvalid(
  errors: Partial<Record<InformationsFieldName, unknown>>,
  fields: readonly InformationsFieldName[],
): number {
  return fields.filter((name) => errors[name] !== undefined).length;
}
