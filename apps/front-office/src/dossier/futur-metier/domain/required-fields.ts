import { listFilledFields, type RequiredFields } from "../../domain/volet-progress";
import {
  findSectionFields,
  type FuturMetierFieldName,
  type FuturMetierFormData,
  type FuturMetierSection,
} from "../schema";

/** Ne change qu'avec le mode de saisie, ou le passage d'un champ de vide à rempli. */
export function findRequiredFields(
  values: FuturMetierFormData,
): RequiredFields<FuturMetierSection, FuturMetierFieldName> {
  const sectionFields = findSectionFields(values.metierViseEntryMode);
  const allFields = Object.values(sectionFields).flat();
  return { sectionFields, allFields, filledFields: listFilledFields(values, allFields) };
}
