import type { UseFormReturn } from "react-hook-form";

import { Demarches } from "../../components/demarches";
import { TYPE_DEMARCHE_LABEL } from "../domain/type-demarche";
import {
  DEMARCHES_CONSTRUCTION_FIELDS,
  useDemarchesConstruction,
} from "../hooks/use-demarches-construction";
import { PROJET_FIELD_LABEL, type ProjetFormData } from "../schema";

/** Ce que reçoit `DemarchesConstruction` : le formulaire du volet. */
export interface DemarchesConstructionProps {
  form: UseFormReturn<ProjetFormData>;
}

/** La question sur les démarches de construction du projet, et ces démarches (maquettes 01 à 04). */
export function DemarchesConstruction({ form }: DemarchesConstructionProps) {
  const demarches = useDemarchesConstruction(form);

  return (
    <Demarches
      control={form.control}
      fields={DEMARCHES_CONSTRUCTION_FIELDS}
      question={{ label: PROJET_FIELD_LABEL.demarcheConstruction }}
      typeLabels={TYPE_DEMARCHE_LABEL}
      state={demarches}
    />
  );
}
