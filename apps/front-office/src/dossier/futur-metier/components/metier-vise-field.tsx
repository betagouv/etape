import { useWatch, type UseFormReturn } from "react-hook-form";

import { RemoteSearchEntryField } from "../../components/remote-search-entry-field";
import { METIER_VISE_SEARCH } from "../metier-vise-search-definition";
import { FUTUR_METIER_FIELD, METIER_VISE_FIELDS, type FuturMetierFormData } from "../schema";
import { MetierViseCard } from "./metier-vise-card";
import { MetierViseManualFields } from "./metier-vise-manual-fields";
import { MetierViseOption } from "./metier-vise-option";

/** Ce que reçoit `MetierViseField` : le formulaire du volet. */
export interface MetierViseFieldProps {
  form: UseFormReturn<FuturMetierFormData>;
}

/** La recherche dans le ROME, la carte du métier choisi, ou la saisie manuelle. */
export function MetierViseField({ form }: MetierViseFieldProps) {
  const { control, setValue, clearErrors } = form;
  const mode = useWatch({ control, name: FUTUR_METIER_FIELD.METIER_VISE_ENTRY_MODE });
  const metierVise = useWatch({ control, name: FUTUR_METIER_FIELD.METIER_VISE });

  return (
    <RemoteSearchEntryField
      control={control}
      name={FUTUR_METIER_FIELD.METIER_VISE}
      search={{
        definition: METIER_VISE_SEARCH,
        renderOption: (appellationRome) => <MetierViseOption appellationRome={appellationRome} />,
      }}
      entry={{
        mode,
        item: metierVise,
        fields: METIER_VISE_FIELDS,
        clearErrors,
        setMode: (nextMode) => setValue(FUTUR_METIER_FIELD.METIER_VISE_ENTRY_MODE, nextMode),
        setItem: (appellationRome, options) =>
          setValue(FUTUR_METIER_FIELD.METIER_VISE, appellationRome, options),
      }}
      renderCard={(appellationRome, cardControl) => (
        <MetierViseCard appellationRome={appellationRome} {...cardControl} />
      )}
      renderManualFields={(manualFieldsControl) => (
        <MetierViseManualFields control={control} {...manualFieldsControl} />
      )}
    />
  );
}
