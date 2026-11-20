import { Controller, useWatch, type UseFormReturn } from "react-hook-form";

import { RemoteSearchField } from "@etape/ui/components/remote-search-field";
import { useEntryMode } from "@etape/ui/hooks/use-entry-mode";

import { EMPLOYEUR_SEARCH, useEmployeurSearch } from "../hooks/use-employeur-search";
import {
  EMPLOYEUR_ENTRY_MODE,
  EMPLOYEUR_FIELDS,
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
  const mode = useWatch({ control, name: "employeurEntryMode" });
  const employeur = useWatch({ control, name: "employeur" });
  const { isFocusRequested, requestFocus, switchMode } = useEntryMode(mode, EMPLOYEUR_FIELDS, {
    clearErrors,
    setMode: (nextMode) => setValue("employeurEntryMode", nextMode),
  });

  const search = useEmployeurSearch((etablissement) => {
    setValue("employeur", etablissement, { shouldValidate: true });
    requestFocus();
  });

  if (mode === EMPLOYEUR_ENTRY_MODE.MANUAL) {
    return (
      <EmployeurManualFields
        control={control}
        isFocusRequested={isFocusRequested}
        onSearch={() => {
          // On repart d'une recherche vide : l'ancienne rouvrirait son alerte « aucun résultat ».
          search.clear();
          switchMode(EMPLOYEUR_ENTRY_MODE.SEARCH);
        }}
      />
    );
  }

  if (employeur) {
    return (
      <EmployeurCard
        etablissement={employeur}
        isFocusRequested={isFocusRequested}
        onChange={() => {
          setValue("employeur", null);
          requestFocus();
        }}
      />
    );
  }

  return (
    <Controller
      name="employeur"
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
          onManualEntry={() => switchMode(EMPLOYEUR_ENTRY_MODE.MANUAL)}
          renderOption={(etablissement) => <EmployeurOption etablissement={etablissement} />}
        />
      )}
    />
  );
}
