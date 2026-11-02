import type { InformationsFieldName, InformationsFormData } from "../schema";

export function countFilled(
  values: Partial<InformationsFormData>,
  fields: readonly InformationsFieldName[],
): number {
  return fields.filter((name) => {
    const value = values[name];
    return typeof value === "string" && value.length > 0;
  }).length;
}

export function countInvalid(
  errors: Partial<Record<InformationsFieldName, unknown>>,
  fields: readonly InformationsFieldName[],
): number {
  return fields.filter((name) => errors[name] !== undefined).length;
}
