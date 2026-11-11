import { listFilledFields, type RequiredFields } from "../../domain/volet-progress";
import {
  findSectionFields,
  type SituationProfessionnelleFieldName,
  type SituationProfessionnelleFormData,
  type SituationProfessionnelleSection,
} from "../schema";

/** Ne change qu'avec le mode de saisie, la réponse sur la démission, ou le passage d'un champ de vide à rempli. */
export function findRequiredFields(
  values: SituationProfessionnelleFormData,
): RequiredFields<SituationProfessionnelleSection, SituationProfessionnelleFieldName> {
  const sectionFields = findSectionFields(values.employeurEntryMode, values.demission);
  const allFields = Object.values(sectionFields).flat();
  return { sectionFields, allFields, filledFields: listFilledFields(values, allFields) };
}
