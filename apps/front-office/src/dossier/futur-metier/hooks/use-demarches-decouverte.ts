import type { UseFormReturn } from "react-hook-form";

import {
  useDemarches,
  type DemarchesBinding,
  type DemarchesFieldNames,
  type UseDemarchesResult,
} from "../../hooks/use-demarches";
import type { TypeDemarche } from "../domain/type-demarche";
import { FUTUR_METIER_FIELD, type FuturMetierFormData } from "../schema";

/** Les champs du volet que ses démarches de découverte affichent et contrôlent. */
export const DEMARCHES_DECOUVERTE_FIELDS: DemarchesFieldNames<FuturMetierFormData, TypeDemarche> = {
  answer: FUTUR_METIER_FIELD.DEMARCHE_DECOUVERTE,
  typeDemarche: FUTUR_METIER_FIELD.TYPE_DEMARCHE,
  precisionTypeDemarche: FUTUR_METIER_FIELD.PRECISION_TYPE_DEMARCHE,
  apportDemarche: FUTUR_METIER_FIELD.APPORT_DEMARCHE,
  piecesJustificatives: FUTUR_METIER_FIELD.PIECES_JUSTIFICATIVES,
};

/** Comment les démarches lisent et écrivent le formulaire « Mon futur métier », pour `useDemarches` et « Mes documents ». */
export function createDemarchesDecouverteBinding(
  form: UseFormReturn<FuturMetierFormData>,
): DemarchesBinding<FuturMetierFormData, TypeDemarche> {
  return {
    fields: DEMARCHES_DECOUVERTE_FIELDS,
    readAnswer: (values) => values.demarcheDecouverte,
    setAnswer: (answer, options) =>
      form.setValue(FUTUR_METIER_FIELD.DEMARCHE_DECOUVERTE, answer, options),
    setDemarches: (demarches) => form.setValue(FUTUR_METIER_FIELD.DEMARCHES, demarches),
    setCurrentDemarche: (current, demarcheId) => {
      form.setValue(FUTUR_METIER_FIELD.CURRENT_DEMARCHE_ID, demarcheId);
      form.setValue(FUTUR_METIER_FIELD.CURRENT_DEMARCHE, current);
    },
    setHasCurrentDemarche: (hasCurrentDemarche) =>
      form.setValue(FUTUR_METIER_FIELD.HAS_CURRENT_DEMARCHE, hasCurrentDemarche),
  };
}

/** Les démarches de découverte du métier : `useDemarches`, relié au formulaire « Mon futur métier ». */
export function useDemarchesDecouverte(
  form: UseFormReturn<FuturMetierFormData>,
): UseDemarchesResult<TypeDemarche> {
  return useDemarches(form, createDemarchesDecouverteBinding(form));
}
