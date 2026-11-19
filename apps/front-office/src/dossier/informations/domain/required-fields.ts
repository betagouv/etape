import { buildRequiredFields, type RequiredFields } from "../../domain/volet-progress";
import {
  type InformationsFieldName,
  type InformationsFormData,
  type InformationsSection,
} from "../schema";
import { INFORMATIONS_SECTION_FIELDS } from "./section-fields";

/** Les champs demandés, toujours les mêmes dans ce volet, et ceux d'entre eux qui sont remplis. */
export function findRequiredFields(
  values: InformationsFormData,
): RequiredFields<InformationsSection, InformationsFieldName> {
  // Aucun champ facultatif n'est contrôlé dans ce volet.
  return buildRequiredFields(values, INFORMATIONS_SECTION_FIELDS);
}
