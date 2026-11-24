import { Demarches } from "../../components/demarches";
import { useDossierVolets } from "../../hooks/use-dossier-volets";
import { TYPE_DEMARCHE_LABEL } from "../domain/type-demarche";
import {
  DEMARCHES_DECOUVERTE_FIELDS,
  useDemarchesDecouverte,
} from "../hooks/use-demarches-decouverte";
import { FUTUR_METIER_FIELD_LABEL } from "../schema";

/** La question sur les démarches de découverte du métier, et ces démarches (maquettes 09 à 15). */
export function DemarchesDecouverte() {
  // Lu ici plutôt que reçu : en prop, le formulaire traverserait trois composants avant ses champs.
  const { form } = useDossierVolets().futurMetier;
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
