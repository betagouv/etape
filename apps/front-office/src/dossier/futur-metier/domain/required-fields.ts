import { listFilledFields, type RequiredFields } from "../../domain/volet-progress";
import {
  type FuturMetierFieldName,
  type FuturMetierFormData,
  type FuturMetierSection,
} from "../schema";
import { findSectionFields, findSectionValidatedFields } from "./section-fields";

/** Ne change qu'avec le mode de saisie, la réponse sur les démarches, le type de démarche, ou le passage d'un champ de vide à rempli. */
export function findRequiredFields(
  values: FuturMetierFormData,
): RequiredFields<FuturMetierSection, FuturMetierFieldName> {
  const { metierViseEntryMode, demarcheDecouverte, typeDemarche } = values;
  const sectionFields = findSectionFields(metierViseEntryMode, demarcheDecouverte, typeDemarche);
  const allFields = Object.values(sectionFields).flat();
  return {
    sectionFields,
    allFields,
    filledFields: listFilledFields(values, allFields),
    sectionValidatedFields: findSectionValidatedFields(
      metierViseEntryMode,
      demarcheDecouverte,
      typeDemarche,
    ),
  };
}
