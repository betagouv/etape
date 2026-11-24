import { useWatch, type UseFormReturn } from "react-hook-form";

import { RemoteSearchEntryField } from "../../components/remote-search-entry-field";
import { EMPLOYEUR_SEARCH } from "../employeur-search-definition";
import {
  EMPLOYEUR_FIELDS,
  SITUATION_PROFESSIONNELLE_FIELD,
  type SituationProfessionnelleFormData,
} from "../schema";
import { EmployeurCard } from "./employeur-card";
import { EmployeurManualFields } from "./employeur-manual-fields";
import { EmployeurOption } from "./employeur-option";

/** Ce que reçoit `EmployeurField` : le formulaire du volet. */
export interface EmployeurFieldProps {
  form: UseFormReturn<SituationProfessionnelleFormData>;
}

/** La recherche Sirene, la carte de l'établissement choisi, ou la saisie manuelle. */
export function EmployeurField({ form }: EmployeurFieldProps) {
  const { control, setValue, clearErrors } = form;
  const mode = useWatch({ control, name: SITUATION_PROFESSIONNELLE_FIELD.EMPLOYEUR_ENTRY_MODE });
  const employeur = useWatch({ control, name: SITUATION_PROFESSIONNELLE_FIELD.EMPLOYEUR });

  return (
    <RemoteSearchEntryField
      control={control}
      name={SITUATION_PROFESSIONNELLE_FIELD.EMPLOYEUR}
      search={{
        definition: EMPLOYEUR_SEARCH,
        renderOption: (etablissement) => <EmployeurOption etablissement={etablissement} />,
      }}
      entry={{
        mode,
        item: employeur,
        fields: EMPLOYEUR_FIELDS,
        clearErrors,
        setMode: (nextMode) =>
          setValue(SITUATION_PROFESSIONNELLE_FIELD.EMPLOYEUR_ENTRY_MODE, nextMode),
        setItem: (etablissement, options) =>
          setValue(SITUATION_PROFESSIONNELLE_FIELD.EMPLOYEUR, etablissement, options),
      }}
      renderCard={(etablissement, cardControl) => (
        <EmployeurCard etablissement={etablissement} {...cardControl} />
      )}
      renderManualFields={(manualFieldsControl) => (
        <EmployeurManualFields control={control} {...manualFieldsControl} />
      )}
    />
  );
}
