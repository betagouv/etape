import { Controller, useWatch, type UseFormReturn } from "react-hook-form";

import { RemoteSearchField } from "@etape/ui/components/remote-search-field";

import { ENTRY_MODE } from "../../domain/entry-mode";
import { useRemoteSearchEntry } from "../../hooks/use-remote-search-entry";
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
  const { search, isFocusRequested, openManualEntry, openSearch, clearItem } = useRemoteSearchEntry(
    EMPLOYEUR_SEARCH,
    mode,
    EMPLOYEUR_FIELDS,
    {
      clearErrors,
      setMode: (nextMode) =>
        setValue(SITUATION_PROFESSIONNELLE_FIELD.EMPLOYEUR_ENTRY_MODE, nextMode),
      setItem: (etablissement, options) =>
        setValue(SITUATION_PROFESSIONNELLE_FIELD.EMPLOYEUR, etablissement, options),
    },
  );

  if (mode === ENTRY_MODE.MANUAL) {
    return (
      <EmployeurManualFields
        control={control}
        isFocusRequested={isFocusRequested}
        onSearch={openSearch}
      />
    );
  }

  if (employeur) {
    return (
      <EmployeurCard
        etablissement={employeur}
        isFocusRequested={isFocusRequested}
        onChange={clearItem}
      />
    );
  }

  return (
    <Controller
      name={SITUATION_PROFESSIONNELLE_FIELD.EMPLOYEUR}
      control={control}
      render={({ field, fieldState }) => (
        <RemoteSearchField
          search={search}
          definition={EMPLOYEUR_SEARCH}
          control={{
            fieldRef: field.ref,
            onBlur: field.onBlur,
            error: fieldState.error,
            isFocusRequested,
          }}
          onManualEntry={openManualEntry}
          renderOption={(etablissement) => <EmployeurOption etablissement={etablissement} />}
        />
      )}
    />
  );
}
