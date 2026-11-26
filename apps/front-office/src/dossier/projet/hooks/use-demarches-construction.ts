import type { UseFormReturn } from "react-hook-form";

import {
  useDemarches,
  type DemarchesBinding,
  type DemarchesFieldNames,
  type UseDemarchesResult,
} from "../../hooks/use-demarches";
import type { TypeDemarche } from "../domain/type-demarche";
import { PROJET_FIELD, type ProjetFormData } from "../schema";

/** Les champs du volet que ses démarches de construction du projet affichent et contrôlent. */
export const DEMARCHES_CONSTRUCTION_FIELDS: DemarchesFieldNames<ProjetFormData, TypeDemarche> = {
  answer: PROJET_FIELD.DEMARCHE_CONSTRUCTION,
  typeDemarche: PROJET_FIELD.TYPE_DEMARCHE,
  precisionTypeDemarche: PROJET_FIELD.PRECISION_TYPE_DEMARCHE,
  apportDemarche: PROJET_FIELD.APPORT_DEMARCHE,
  piecesJustificatives: PROJET_FIELD.PIECES_JUSTIFICATIVES,
};

/** Comment les démarches lisent et écrivent le formulaire « Mon projet », pour `useDemarches` et « Mes documents ». */
export function createDemarchesConstructionBinding(
  form: UseFormReturn<ProjetFormData>,
): DemarchesBinding<ProjetFormData, TypeDemarche> {
  return {
    fields: DEMARCHES_CONSTRUCTION_FIELDS,
    readAnswer: (values) => values.demarcheConstruction,
    setAnswer: (answer, options) =>
      form.setValue(PROJET_FIELD.DEMARCHE_CONSTRUCTION, answer, options),
    setDemarches: (demarches) => form.setValue(PROJET_FIELD.DEMARCHES, demarches),
    setCurrentDemarche: (current, demarcheId) => {
      form.setValue(PROJET_FIELD.CURRENT_DEMARCHE_ID, demarcheId);
      form.setValue(PROJET_FIELD.TYPE_DEMARCHE, current.typeDemarche);
      form.setValue(PROJET_FIELD.PRECISION_TYPE_DEMARCHE, current.precisionTypeDemarche);
      form.setValue(PROJET_FIELD.APPORT_DEMARCHE, current.apportDemarche);
      form.setValue(PROJET_FIELD.PIECES_JUSTIFICATIVES, current.piecesJustificatives);
    },
    setHasCurrentDemarche: (hasCurrentDemarche) =>
      form.setValue(PROJET_FIELD.HAS_CURRENT_DEMARCHE, hasCurrentDemarche),
  };
}

/** Les démarches de construction du projet : `useDemarches`, relié au formulaire « Mon projet ». */
export function useDemarchesConstruction(
  form: UseFormReturn<ProjetFormData>,
): UseDemarchesResult<TypeDemarche> {
  return useDemarches(form, createDemarchesConstructionBinding(form));
}
