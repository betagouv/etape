import { buildRequiredFields, type RequiredFields } from "../../domain/volet-progress";
import {
  type SituationProfessionnelleFieldName,
  type SituationProfessionnelleFormData,
  type SituationProfessionnelleSection,
} from "../schema";
import { findSectionFields } from "./section-fields";

/** Ne change qu'avec le mode de saisie, la réponse sur la démission, ou le passage d'un champ de vide à rempli. */
export function findRequiredFields(
  values: SituationProfessionnelleFormData,
): RequiredFields<SituationProfessionnelleSection, SituationProfessionnelleFieldName> {
  // Aucun champ facultatif n'est contrôlé dans ce volet.
  return buildRequiredFields(
    values,
    findSectionFields(values.employeurEntryMode, values.demission),
  );
}
