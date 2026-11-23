import { Controller, useWatch, type UseFormReturn } from "react-hook-form";

import { RemoteSearchField } from "@etape/ui/components/remote-search-field";

import { ENTRY_MODE } from "../../domain/entry-mode";
import { useRemoteSearchEntry } from "../../hooks/use-remote-search-entry";
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
  const { search, isFocusRequested, openManualEntry, openSearch, clearItem } = useRemoteSearchEntry(
    METIER_VISE_SEARCH,
    mode,
    METIER_VISE_FIELDS,
    {
      clearErrors,
      setMode: (nextMode) => setValue(FUTUR_METIER_FIELD.METIER_VISE_ENTRY_MODE, nextMode),
      setItem: (appellationRome, options) =>
        setValue(FUTUR_METIER_FIELD.METIER_VISE, appellationRome, options),
    },
  );

  if (mode === ENTRY_MODE.MANUAL) {
    return (
      <MetierViseManualFields
        control={control}
        isFocusRequested={isFocusRequested}
        onSearch={openSearch}
      />
    );
  }

  if (metierVise) {
    return (
      <MetierViseCard
        appellationRome={metierVise}
        isFocusRequested={isFocusRequested}
        onChange={clearItem}
      />
    );
  }

  return (
    <Controller
      name={FUTUR_METIER_FIELD.METIER_VISE}
      control={control}
      render={({ field, fieldState }) => (
        <RemoteSearchField
          search={search}
          definition={METIER_VISE_SEARCH}
          control={{
            fieldRef: field.ref,
            onBlur: field.onBlur,
            error: fieldState.error,
            isFocusRequested,
          }}
          onManualEntry={openManualEntry}
          renderOption={(appellationRome) => <MetierViseOption appellationRome={appellationRome} />}
        />
      )}
    />
  );
}
