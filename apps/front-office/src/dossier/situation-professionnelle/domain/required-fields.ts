import {
  findSectionFields,
  type SituationProfessionnelleFieldName,
  type SituationProfessionnelleFormData,
  type SituationProfessionnelleSection,
} from "../schema";
import { listFilledFields } from "./count-fields";

/** Les champs exigés par les réponses en cours, et ceux d'entre eux qui sont remplis. */
export interface RequiredFields {
  sectionFields: Record<
    SituationProfessionnelleSection,
    readonly SituationProfessionnelleFieldName[]
  >;
  allFields: readonly SituationProfessionnelleFieldName[];
  filledFields: readonly SituationProfessionnelleFieldName[];
}

/** Ne change qu'avec le mode de saisie, la réponse sur la démission, ou le passage d'un champ de vide à rempli. */
export function findRequiredFields(values: SituationProfessionnelleFormData): RequiredFields {
  const sectionFields = findSectionFields(values.employeurEntryMode, values.demission);
  const allFields = Object.values(sectionFields).flat();
  return { sectionFields, allFields, filledFields: listFilledFields(values, allFields) };
}
