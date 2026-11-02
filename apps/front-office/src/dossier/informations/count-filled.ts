import type { InformationsFieldName, InformationsFormData } from "./schema";

export function countFilled(
  values: Partial<InformationsFormData>,
  fields: readonly InformationsFieldName[],
): number {
  return fields.filter((name) => {
    const v = values[name];
    return typeof v === "string" && v.length > 0;
  }).length;
}
