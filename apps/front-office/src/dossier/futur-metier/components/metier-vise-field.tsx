import { Controller, useWatch, type UseFormReturn } from "react-hook-form";

import { RemoteSearchField } from "@etape/ui/components/remote-search-field";
import { useEntryMode } from "@etape/ui/hooks/use-entry-mode";

import { METIER_VISE_SEARCH, useMetierViseSearch } from "../hooks/use-metier-vise-search";
import { METIER_VISE_ENTRY_MODE, METIER_VISE_FIELDS, type FuturMetierFormData } from "../schema";
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
  const mode = useWatch({ control, name: "metierViseEntryMode" });
  const metierVise = useWatch({ control, name: "metierVise" });
  const { isFocusRequested, requestFocus, switchMode } = useEntryMode(mode, METIER_VISE_FIELDS, {
    clearErrors,
    setMode: (nextMode) => setValue("metierViseEntryMode", nextMode),
  });

  const search = useMetierViseSearch((appellationRome) => {
    setValue("metierVise", appellationRome, { shouldValidate: true });
    requestFocus();
  });

  if (mode === METIER_VISE_ENTRY_MODE.MANUAL) {
    return (
      <MetierViseManualFields
        control={control}
        isFocusRequested={isFocusRequested}
        onSearch={() => {
          // On repart d'une recherche vide : l'ancienne rouvrirait son alerte « aucun résultat ».
          search.clear();
          switchMode(METIER_VISE_ENTRY_MODE.SEARCH);
        }}
      />
    );
  }

  if (metierVise) {
    return (
      <MetierViseCard
        appellationRome={metierVise}
        isFocusRequested={isFocusRequested}
        onChange={() => {
          setValue("metierVise", null);
          requestFocus();
        }}
      />
    );
  }

  return (
    <Controller
      name="metierVise"
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
          onManualEntry={() => switchMode(METIER_VISE_ENTRY_MODE.MANUAL)}
          renderOption={(appellationRome) => <MetierViseOption appellationRome={appellationRome} />}
        />
      )}
    />
  );
}
