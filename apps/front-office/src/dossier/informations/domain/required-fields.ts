import { listFilledFields, type RequiredFields } from "../../domain/volet-progress";
import {
  INFORMATIONS_SECTION_FIELDS,
  type InformationsFieldName,
  type InformationsFormData,
  type InformationsSection,
} from "../schema";

const ALL_REQUIRED_FIELDS = Object.values(INFORMATIONS_SECTION_FIELDS).flat();

/** Les champs demandés, toujours les mêmes dans ce volet, et ceux d'entre eux qui sont remplis. */
export function findRequiredFields(
  values: InformationsFormData,
): RequiredFields<InformationsSection, InformationsFieldName> {
  return {
    sectionFields: INFORMATIONS_SECTION_FIELDS,
    allFields: ALL_REQUIRED_FIELDS,
    filledFields: listFilledFields(values, ALL_REQUIRED_FIELDS),
  };
}
