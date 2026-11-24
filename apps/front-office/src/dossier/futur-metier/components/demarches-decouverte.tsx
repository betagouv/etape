import type { UseFormReturn } from "react-hook-form";

import { Demarches } from "../../components/demarches";
import { TYPE_DEMARCHE_LABEL } from "../domain/type-demarche";
import {
  DEMARCHES_DECOUVERTE_FIELDS,
  useDemarchesDecouverte,
} from "../hooks/use-demarches-decouverte";
import { FUTUR_METIER_FIELD_LABEL, type FuturMetierFormData } from "../schema";

/** Ce que reçoit `DemarchesDecouverte` : le formulaire du volet. */
export interface DemarchesDecouverteProps {
  form: UseFormReturn<FuturMetierFormData>;
}

/** La question sur les démarches de découverte du métier, et ces démarches (maquettes 09 à 15). */
export function DemarchesDecouverte({ form }: DemarchesDecouverteProps) {
  const demarches = useDemarchesDecouverte(form);

  return (
    <Demarches
      control={form.control}
      fields={DEMARCHES_DECOUVERTE_FIELDS}
      question={{
        label: FUTUR_METIER_FIELD_LABEL.demarcheDecouverte,
        description:
          "Exemples : Immersion en entreprise, rencontres avec des professionnels, salons, recherches…",
      }}
      typeLabels={TYPE_DEMARCHE_LABEL}
      state={demarches}
    />
  );
}
