import { Demarches } from "../../components/demarches";
import { useDossierVolets } from "../../hooks/use-dossier-volets";
import { TYPE_DEMARCHE_LABEL } from "../domain/type-demarche";
import {
  DEMARCHES_CONSTRUCTION_FIELDS,
  useDemarchesConstruction,
} from "../hooks/use-demarches-construction";
import { PROJET_FIELD_LABEL } from "../schema";

/** La question sur les démarches de construction du projet, et ces démarches (maquettes 01 à 04). */
export function DemarchesConstruction() {
  // Lu ici plutôt que reçu : en prop, le formulaire traverserait trois composants avant ses champs.
  const { form } = useDossierVolets().projet;
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
